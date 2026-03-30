import {create} from 'zustand';
import axios from "axios";
// import { mockMyself, mockFriends } from './fictif';

export type Myself = {
    id: string,
    username: string,
    avatarUrl: string,
    isOnline: boolean,
    email: string,
    password: string,
    createdAt: string,
    level?: number,
    experience?: number
};

export type Friends = {
    id: string,
    username: string,
    avatarUrl: string,
    isOnline: boolean,
    email: string,
    createdAt: string
};

interface UserStore {
    userMyself: Myself | null;
    userFriends: Friends[];
    waitingRequest: string[];
    NotifMsgUnread: string[];

    fetchMe: () => Promise<Myself | null>;
    fetchFriends: () => Promise<void>;

    initsocket: (socket: any) => void;
    // updateMyself: (newMe: Partial<Myself>) => void;
    // AddFriend: (newFriend: Partial<Friends>) =>void
};

const useUser = create<UserStore>((set, get) => ({

    userMyself: null,
    userFriends: [],
    // userMyself: mockMyself,
    // userFriends: mockFriends,
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
        try {
            const result = await axios.get('/api/friends', {
                withCredentials: true,
            });
            if (!result.data.success || !Array.isArray(result.data.friends)) {
                throw Error(`Error API Friends: ${result.status} ${result.statusText}`);
            }
            const friends = result.data.friends.map((f: any) => {
                // [
                //     { "user1": { "id": "moi", ... }, "user2": { "id": "ami1", ... } },
                //     { "user1": { "id": "ami2", ... }, "user2": { "id": "moi", ... } }
                // ]
                if (f.user1.id === myself.id)
                    return f.user2;
                else
                    return f.user1;
                
            });
            set({userFriends:friends});
        }
        catch(error) {
            console.error('Error fetch : ', error);
        }
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
            set(state => ({
                userFriends: state.userFriends.map(friend => friend.id === data.userId ? { ...friend, username:data.user.username, email:data.user.email} : friend)
            }))
        })

        socket.on("friend:avatar_updated", (data: { userId: string, avatarUrl: string}) => {
            set(state => ({
                userFriends: state.userFriends.map(friend => friend.id === data.userId ? { ...friend, avatarUrl:data.avatarUrl} : friend)
            }))
        })
    }
}));

export default useUser;