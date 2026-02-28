import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client';

export const TheSocket = () => {
    const [socket, setSocket] = useState<Socket | null>(null);
    
    useEffect(() => {
        const NewSocket = io("https://localhost:1443", {withCredentials: true});
        NewSocket.on("connect", () => {
            console.log("connecte au server");
        })
        setSocket(NewSocket);
        return () => {
            NewSocket.disconnect();
        };
    }, []);
    
    return socket;
}