import {create} from 'zustand';
import axios from "axios";
import React from 'react';

export type Myself = {
    id: string,
    username: string,
    avatarUrl: string,
    isOnline: boolean,
    email: string,
    password: string,
    createdAt: string,
    level?: number,
    experience?: number,
    matchWins: Match[],
	matchLosses: Match[],
};

export type Friends = {
    id: string,
    username: string,
    avatarUrl: string,
    isOnline: boolean,
    email: string,
    createdAt: string
};

export type Match = {
	id: String,
	startedAt: Date,
	endedAt: Date,
	durationSec: number,
	isOvertime: Boolean,
	winnerId: String | null,
	loserId: String | null,
	winnerLabel: String,
	loserLabel: String,
	scoreWinner: number,
	scoreLoser: number,
};

export const defaultAvatar = "/avatars/default_avatar.png";
export const AvatarErrorLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = defaultAvatar;
};

interface UserStore {
    userMyself: Myself | null;
    userFriends: Friends[];
    waitingRequest: string[];
    NotifMsgUnread: string[];

    fetchMe: () => Promise<Myself | null>;
    fetchFriends: () => Promise<void>;

    initsocket: (socket: any) => void;
};

const useUser = create<UserStore>((set, get) => ({

    userMyself: null,
    userFriends: [],
    waitingRequest: [],
    NotifMsgUnread: [],

    ////////////////////////////////////////Myself////////////////////////////////////////
    fetchMe: async (): Promise<Myself | null> => {
        try {
            const response = await axios.get('/api/users/me', { withCredentials:true });
            if (!response.data.success) {
                throw Error(`Error API Me: ${response.status} ${response.statusText}`);
            }
            set({userMyself: response.data.user});
            await get().fetchFriends();

            const friends = get().userFriends;
            const sendersTab: string[] = []; // creation de tableau vide pour ajouter les amis qui ont envoyer des messages non lu
            for (const friend of friends)
            {
                const result = await axios.get(`/api/users/chat/${friend.id}`, {withCredentials:true});
                const unreadExist = result.data.messages.some((msg:any) => msg.senderId === friend.id && msg.read === false);
                if (unreadExist)
                    sendersTab.push(friend.id);//modifie le tableau en ajoutant l ami si y a au moins un de ses messages qui n est pas lu
            }
            set({NotifMsgUnread : sendersTab});
            return (response.data.user);
        }
        catch(error) {
            return (null);
        }
    },

    ////////////////////////////////////////Friends////////////////////////////////////////
    fetchFriends: async (): Promise<void> =>
    {
        const myself = get().userMyself;
        if (!myself)
            return;
        const result = await axios.get('/api/friends', {
            withCredentials: true,
        });
        if (!result.data.success || !Array.isArray(result.data.friends)) {
            throw Error(`Error API Friends: ${result.status} ${result.statusText}`);
        }
        const friends = result.data.friends.map((f: any) => {
            if (f.user1.id === myself.id)
                return f.user2;
            else
                return f.user1;

        });
        set({userFriends:friends});
    },

    initsocket: (socket) => {
        socket.on("friend:request_accepted", () => {
            get().fetchFriends();
            set({waitingRequest: []});
        });

        socket.on("friend:unfriended", () => {
            get().fetchFriends();
        });

        socket.on("friend:status_changed", (data: {userId: string, isOnline: boolean}) => {
            set(state => ({
                userFriends: state.userFriends.map(friend => friend.id === data.userId ? { ...friend, isOnline:data.isOnline} : friend)
            }));
        });

        socket.on("privMessage", (data: { senderId: string}) => {
            set(state => ({
                NotifMsgUnread : state.NotifMsgUnread.includes(data.senderId) ? state.NotifMsgUnread : [...state.NotifMsgUnread, data.senderId],
            }));
        })

        socket.on("friend:profile_updated", (data: { userId: string, user: {username: string, email:string}}) => {
            if (data.userId === get().userMyself?.id)
            {
                set(state => ({
                    userMyself: state.userMyself ? { ...state.userMyself, username:data.user.username, email:data.user.email} : null
                }));
            }
            set(state => ({
                userFriends: state.userFriends.map(friend => friend.id === data.userId ? { ...friend, username:data.user.username, email:data.user.email} : friend)
            }))
            get().fetchFriends();
        })

        socket.on("friend:avatar_updated", (data: { userId: string, avatarUrl: string}) => {
            if (data.userId === get().userMyself?.id)
            {
                set(state => ({
                    userMyself: state.userMyself ? { ...state.userMyself, avatarUrl:data.avatarUrl} : null
                }));
            }
            set(state => ({
                userFriends: state.userFriends.map(friend => friend.id === data.userId ? { ...friend, avatarUrl:data.avatarUrl} : friend)
            }))
        })
    }
}));

export default useUser;