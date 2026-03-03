import { useState } from 'react';
import './style/Profile.css';

export default function Profile ()
{
    // const [myself, setMyself] = useState<{id: string, username:string, avatarUrl:string, isOnline:boolean} | null>(null);
    
    // useEffect(() => {
    //     const fetchMe = async () => {
    //         try {
    //             const response = await axios.get('/api/users/me', {
    //                 withCredentials:true
    //             });
    //             if (!response.data.success) {
    //                 throw Error (`Error API Me: ${response.status} ${response.statusText}`);
    //             }
    //             setMyself(response.data.user);
    //         }
    //         catch (error)
    //         {
    //             console.error(error);
    //         }
    //     }
    //     fetchMe()
    // }, []);

    type User = {
        id: string;
        username: string;
        avatarUrl: string;
        isOnline: boolean;
        email?: string;
        createdAt?: string;
    };

    const Me: User = {
        id: '1',
        username: 'nnn',
        avatarUrl: '/pp/default.jpg',
        isOnline: true,
        email: 'nnn@example.com',
        createdAt: '2024-01-15',
    };

    const FRIENDS: User[] = [
    { id: '2', username: 'Alice',   avatarUrl: '/pp/default.jpg', isOnline: true  },
    { id: '3', username: 'Bob',     avatarUrl: '/pp/default.jpg', isOnline: false },
    { id: '4', username: 'Charlie', avatarUrl: '/pp/default.jpg', isOnline: true  },
    { id: '5', username: 'Dasddddddddddddddddddddddddddddddddddvid',   avatarUrl: '/pp/default.jpg', isOnline: false },
    { id: '6', username: 'Eva',     avatarUrl: '/pp/default.jpg', isOnline: true  },
    ];


    const [selectUser, setselectUser] = useState<User | null>(Me);
   
    // const MyProfile = () => {
    //     setViewedUser(Me);
    //     setIsMe(true);
    //     setAvatarPreview(null);
    // };
    const status = (isOnline: boolean) => {
    if (isOnline)
        return "bg-emerald-500";
    return "bg-gray-300";
  }

    return (
        <div className="all_screen">
            <div className="left">
                {/* <div className="friend"> */}
                    <div className="me" onClick={()=>setselectUser(Me)}>
                        <div className="display_me">
                            <img className="rounded-full w-10 h-10" src={Me.avatarUrl}></img>
                            <span className="truncate">{Me.username}</span>
                        </div>
                    </div>
                    <div className="box_lst_friend">
                        {FRIENDS.map((theFriend, idx) => (
                            <div className="display_friends" key={idx} onClick={()=>setselectUser(theFriend)}>
                                <img className="rounded-full w-9 h-9" src={theFriend.avatarUrl}></img>
                                <span className={`status ${status(theFriend.isOnline)}`}></span>
                                <span className="truncate">{theFriend.username}</span>
                            </div>
                        ))}
                    </div>
                    {/* <div className="flex flex-col">
                        <div>changer avatar</div>
                    </div> */}
                    {/* <div className="w-2/3 bg-orange-200">wwwwww</div> */}

                        {/* <div className='w-1/3 bg-orange-300'>sdf</div>
                        <div className="w-2/3  bg-orange-500">
                            
                        </div> */}
                {/* </div> */}
            </div>
            {/* //////////////////////////////////////////////////////////////// */}
            <div className="box_profile">
                <div className="profile" >{selectUser?.username}</div>
                <div className="scoreboard">swsssss</div>
            </div>
            
        </div>
    )
}
