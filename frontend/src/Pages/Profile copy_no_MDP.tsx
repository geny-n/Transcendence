import { useEffect, useState } from 'react';
import axios from "axios";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_updateForm, updateForm } from '../lib/types';

import './style/Profile.css';

export default function Profile ()
{
    // const [User, setUser] = useState<{id: string, username:string, avatarUrl:string, isOnline:boolean, email:string, password: string, createAt: string} | null>(null);
    const [lstFriends, setLstFriends] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    const [Myself, setMyself] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string} | null>(null);
    const [selectUser, setSelectUser] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string} | null>(null);
    const [ActiveUpdate, setActiveUpdate] = useState(0);
    const [errMsg, setErrMsg] = useState<string>('');

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await axios.get('/api/users/me', {
                withCredentials:true
                });
                if (!response.data.success) {
                throw Error(`Error API Me: ${response.status} ${response.statusText}`);
                }
                setMyself(response.data.user);
                setSelectUser(response.data.user);
            }
            catch(error) {
                console.error('User not authenticated, redirecting to login...', error);
                // navigate('/login');
            }
        }
        fetchMe()
    }, []);


    useEffect(() => {
        if (!Myself)
            return;
        const fetchFriends = async () => {
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
                    if (f.user1.id === Myself.id)
                        return f.user2;
                    else
                        return f.user1;
                    
                });
                setLstFriends(friends);
            }
            catch(error) {
                console.error('Error fetch : ', error);
            }
        }
        fetchFriends();
    }, [Myself]);

    

    // const searchUser = async () => {
    //     try {
    //         const res = await axios.get(`/api/users/search?q=${query}`, { withCredentials: true });
    //         setSearchResults(res.data.users);
    //     } catch (error) {
    //         console.error('Erreur recherche :', error);
    //     }
    // }
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors}
      } = useForm<T_updateForm>({
        resolver: zodResolver(updateForm),
    });

    const onShow = () => {
        reset({username: selectUser?.username, email:selectUser?.email});
        setActiveUpdate(1);
    }

    const handleUpdate = async (data:T_updateForm) => {
        if (!selectUser || !Myself)
            return;
        //envoie une requete PUT au back avec les nouvelles valeurs et met a jour la BD 
        try {
            await axios.put('/api/users/me', 
                {
                    username: data.username || selectUser.username,
                    email: data.email || selectUser.email
                }, 
                {withCredentials: true}
            );
            setErrMsg("");
            //permet de voir la modification dans le front
            setSelectUser({
                ...selectUser, username:data.username || selectUser.username, 
                    email:data.email || selectUser.email
            });
            setMyself({
                ...Myself, username:data.username || Myself.username, 
                    email:data.email || Myself.email
            });
            setActiveUpdate(0);
        }
        catch(err) 
        {
            if (axios.isAxiosError(err)) 
            {
                if (err.response?.status == 400)
                    setErrMsg("Nom d'utilisateur ou email déjà utilisé")
            }
        }
    }

    const WhichProfile = () => {
        if (!selectUser || !Myself)
            return null;
        
        /////////////////////////////////////////////////////////////////
        if (selectUser.id === Myself.id)
            return (
              <div>
                <div className="profile">
                    <img className="rounded-full w-30 h-30 mx-14" src={selectUser?.avatarUrl}></img>
                    {ActiveUpdate === 0 && (
                        <div  className="bg-green-400">
                            <div className="text-3xl text-left truncate flex flex-col mt-2">
                                {selectUser?.username}
                                <br/>
                                {selectUser?.email}
                            </div>
                            <div className="bg-blue-600"><button onClick={onShow}>modifier</button></div>
                            
                        </div>
                    )}
                    {ActiveUpdate === 1 && (
                        <div className="bg-green-400">
                            <form onSubmit={handleSubmit(handleUpdate, (errors) => console.log("erreurs zod:", errors))}>

                                
                                <div className="flex flex-col gap-3">
                                    <input {...(register("username", {onChange: () => {setErrMsg('')}}))} className="rounded-lg bg-gray-900"  type="text" placeholder={selectUser?.username}/>
                                        {errors.username && <p className="text-left text-red-500 text-xs">{`${errors.username.message}`}</p>}
                                    
                                    <input {...(register("email", {onChange: () => {setErrMsg('')}}))} className="rounded-lg bg-gray-900"  type="text" placeholder={selectUser?.email}/>
                                        {errors.email && <p className="text-left text-red-500 text-xs">{`${errors.email.message}`}</p>}
                                    
                                    <input className="rounded-lg bg-gray-900" type="text" placeholder="Pass"/>
                                    {errMsg && <p className="text-red-500 text-xs">{errMsg}</p>}
                                </div>
                                <div className="mt-5 flex gap-13">
                                    <button type="submit">Sauvegarder</button>
                                    <button type="button" onClick={() => {setActiveUpdate(0); setErrMsg('');}}>Annuler</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
              </div> 
            );
        /////////////////////////////////////////////////////////////////
        else
            return (
                <div className="profile">
                    <img className="rounded-full w-30 h-30 mx-14" src={selectUser?.avatarUrl}></img>
                    <div className="text-3xl text-left truncate flex flex-col mt-7">
                        {selectUser?.username}
                        <br/>
                        {selectUser?.email}
                    </div>
                </div>
            );
    }

    const status = (isOnline: boolean) => {
    if (isOnline)
        return "bg-emerald-500";
    return "bg-gray-300";
  }

  type Match = {
    id: string;
    opponent: string;
    result: 'win' | 'loss';
    scoreWinner: number;
    scoreLoser: number;
    durationSec: number;
    date: string;
    };

    const Scores: Record<string, Match[]> = {
        '1': [ // nnn
            { id: 'a1', opponent: 'Alice',   result: 'win',  scoreWinner: 11, scoreLoser: 7,  durationSec: 320, date: '2024-03-01' },
            { id: 'a2', opponent: 'Bob',     result: 'loss', scoreWinner: 11, scoreLoser: 5,  durationSec: 280, date: '2024-02-28' },
            { id: 'a3', opponent: 'Charlie', result: 'win',  scoreWinner: 11, scoreLoser: 9,  durationSec: 410, date: '2024-02-25' },
        ],
        '2': [ // Alice
            { id: 'b1', opponent: 'nnn',     result: 'loss', scoreWinner: 11, scoreLoser: 7,  durationSec: 320, date: '2024-03-01' },
            { id: 'b2', opponent: 'Charlie', result: 'win',  scoreWinner: 11, scoreLoser: 6,  durationSec: 300, date: '2024-02-22' },
        ],
        '3': [ // Bob
            { id: 'c1', opponent: 'nnn',     result: 'win',  scoreWinner: 11, scoreLoser: 5,  durationSec: 280, date: '2024-02-28' },
        ],
    };

    return (
        <div className="all_screen">
            <div className="left">
                {/* <div className="box_search">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                    />
                    <button onClick={searchUser}>🔍</button>

                    {searchResults.map((user) => (
                        <div key={user.id} onClick={() => {
                            setSelectUser(user);
                            setSearchResults([]); // ferme les résultats après sélection
                            setQuery('');
                        }}>
                            <img className="rounded-full w-8 h-8" src={user.avatarUrl} />
                            <span>{user.username}</span>
                            </div>
                    ))}
                </div>       */}



                {/* <div className="friend"> */}
                    <div className="box_me" onClick={()=>setSelectUser(Myself)}>
                        <div className="display_me">
                            <img className="rounded-full w-10 h-10" src={Myself?.avatarUrl}></img>
                            <span className="truncate">{Myself?.username}</span>
                        </div>
                    </div>

                    <div className="box_notif">
                        <div className="notif_msg">friend sent you a message</div>
                        <div className="notif_request">friend request</div>
                    </div>

                    <div className="box_lst_friend">
                        {lstFriends.map((theFriend, idx) => (
                            <div className="display_friends" key={idx} onClick={()=>setSelectUser(theFriend)}>
                                <img className="rounded-full w-9 h-9" src={theFriend.avatarUrl}></img>
                                <span className={`status ${status(theFriend.isOnline)}`}></span>
                                <span className="truncate">{theFriend.username}</span>
                            </div>
                        ))}
                    </div>
            </div>
            {/* //////////////////////////////////////////////////////////////// */}
            <div className="box_profile">
                {WhichProfile()}

                <div className="scoreboad_frame">
                    <div className="flex py-5 border-b">
                        <div className="w-1/3">adversaire</div>
                        <div className="w-1/3">resultat</div>
                        <div className="w-1/3">score</div>
                        <div className="w-1/3">duree</div>
                        <div className="w-1/3">date</div>
                    </div>
                    {(Scores[selectUser?.id ?? ''] ?? []).map(match => (
                        <div className="flex border-t border-gray-700 py-5">
                            <div className="w-1/3">{match.opponent}</div>
                            <div className="w-1/3">{match.result}</div>
                            <div className="w-1/3">{match.scoreLoser} / {match.scoreWinner}</div>
                            <div className="w-1/3">{match.durationSec}</div>
                            <div className="w-1/3">{match.date}</div>
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
    )
}
