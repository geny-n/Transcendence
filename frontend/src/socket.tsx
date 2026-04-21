import React, {createContext, useState, useEffect, useContext} from 'react';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { useAuth } from './main';
import useUser from './lib/user';
import { useNavigate } from 'react-router-dom';

import type { DefaultEventsMap } from '@socket.io/component-emitter';

const context = createContext<{socket: Socket | null}>({socket: null});

export const TheSocket = () => {
	return useContext(context);
}

//composent parent qui donnera acces a toutes les valeurs du contexte au composnt enfant
//accepte un parametre sou forme d objet(enfant de type reactnode) children represente nimport quel composant enfant a l interieur du socket provider
export const SocketProvider = ({children}:{children: React.ReactNode}) => {
	const [socket, setSocket] = useState<Socket | null>(null);
	const [isConnected, setIsConnected] = useState<boolean>(false);
	const { user, setUser } = useAuth();
	const navigate = useNavigate();


	useEffect(() => {
		let NewSocket : Socket<DefaultEventsMap, DefaultEventsMap> | null = null;
		
		if (!user) {
			setSocket(null);
			return;
		}

		const handleConfirmation = () => {
			setIsConnected(true);
		};

		// const handleDisconnect = () => {
		// 	setIsConnected(false);
		// };

		NewSocket = io({
			path: "/socket.io",
			withCredentials: true,
			reconnection: false,
		});

		NewSocket.on('connect', handleConfirmation);
		NewSocket.on('disconnect', (reason: string) => {
			setIsConnected(false);
			if (reason === "io server disconnect" && useUser.getState().userMyself !== null)
			{
				useUser.setState({ userMyself: null, userFriends: []});
				setUser(null);
				sessionStorage.setItem('User deleted', '1');
				navigate('/login');
			}
		});

		NewSocket.on('connect_error', (err: Error) => {
			console.log(err.message);
		});
		NewSocket.on('error', (err: Error) => {
			console.log(err);
		});

		setSocket(NewSocket);
		return () => {
			if (NewSocket) {
				NewSocket.off('connect', handleConfirmation);
				// NewSocket.off('disconnect', handleDisconnect);
				NewSocket.off('connect_error', handleConfirmation);
				// NewSocket.off('error', handleDisconnect);
				NewSocket.disconnect();
			}
		};

	}, [user]);
	return (
		<context.Provider value={{socket:socket}}>
			{children}
			<span className='fixed top-0 right-0'>
				{isConnected ? '🟢' : '🔴'}
			</span>
		</context.Provider>
	)
}
