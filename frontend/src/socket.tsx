import React, {createContext, useState, useEffect, useContext} from 'react';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client';

const context = createContext<{socket: Socket | null}>({socket: null});

export const TheSocket = () => {
    return useContext(context);
}

//composent parent qui donnera acces a toutes les valeurs du contexte au composnt enfant
//accepte un parametre sou forme d objet(enfant de type reactnode) children represente nimport quel composant enfant a l interieur du socket provider
export const SocketProvider = ({children}:{children: React.ReactNode}) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState<boolean>(false);

    useEffect(() => {
        const NewSocket = io({
            path: "/socket.io", 
            withCredentials: true
        });

        const handleConfirmation = () => {
            setIsConnected(true);
        };

        const handleDisconnect = () => {
            setIsConnected(false);
        };

        NewSocket.on('connect', handleConfirmation);
        NewSocket.on('disconnect', handleDisconnect);
        setSocket(NewSocket);
        return () => {
            NewSocket.off('connect', handleConfirmation);
            NewSocket.off('disconnect', handleDisconnect);
            NewSocket.disconnect();
        };

    }, []);
    return (
        <context.Provider value={{socket:socket}}>
            {children}
            <span className='fixed top-0 right-0'>
                {isConnected ? '🟢' : '🔴'}
            </span>
        </context.Provider>
    )
}

// export const TheSocket = () => {
//     const [socket, setSocket] = useState<Socket | null>(null);
    
//     useEffect(() => {
//         const NewSocket = io({
//             path: "/socket.io", 
//             withCredentials: true
//         });
//         NewSocket.on("connect", () => {
//             console.log("connecte au server");
//         })
//         setSocket(NewSocket);
//         return () => {
//             NewSocket.disconnect();
//         };
//     }, []);
    
//     return socket;
// }