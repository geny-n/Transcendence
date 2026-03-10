import { useEffect, useState } from 'react';
import axios from "axios";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_updateForm, updateForm } from '../lib/types';
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye, LuEyeClosed } from "react-icons/lu"; //eyes icon
import { CgProfile } from "react-icons/cg";//profile icon
import './style/Profile.css';

export default function Profile ()
{
    // const [User, setUser] = useState<{id: string, username:string, avatarUrl:string, isOnline:boolean, email:string, password: string, createAt: string} | null>(null);
    const [lstFriends, setLstFriends] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    const [Myself, setMyself] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, password: string, createdAt: string} | null>(null);
    const [selectUser, setSelectUser] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, password?: string, createdAt: string} | null>(null);
    const [ActiveUpdate, setActiveUpdate] = useState(0);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const passwordVisibility = () => setShowPassword(!showPassword);
    const [errMsg, setErrMsg] = useState<string>('');

    useEffect(() => {//recuperer mes informations
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


    useEffect(() => {//recuperer la liste des amis depuis le back 
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
    const { // retourne des outils pour gerer le formulaire
        register, //faire le lien avec le input du form
        handleSubmit, // valide les champs avec zod si error envoie le message d erreur 
        reset,
        formState: {errors}
      } = useForm<T_updateForm>({//dit a react-hook-form d utiliser le schema zod pour valider les champs
        resolver: zodResolver(updateForm), 
    });

    const onShow = () => {
        reset({username: selectUser?.username, email:selectUser?.email, password:''});//pre remplir les champs par les avaleurs actuelles 
        setActiveUpdate(1);
    }

    const handleUpdate = async (data:T_updateForm) => { // modification des donnes et maj dans la bd
        if (!selectUser || !Myself)
            return;
        //envoie une requete PUT au back avec les nouvelles valeurs et met a jour la BD 
        try {
            const datas:any = {
                username: data.username || selectUser.username,
                email: data.email || selectUser.email,
            };
            if (data.password)
                datas.password = data.password;
            await axios.put('/api/users/me', datas, {withCredentials: true});
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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await axios.put('/api/users/me/avatar', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSelectUser({ ...selectUser!, avatarUrl: res.data.avatarUrl });
            setMyself({ ...Myself!, avatarUrl: res.data.avatarUrl });
        } catch(err) {
            console.error(err);
        }
    };

    const WhichProfile = () => {
        if (!selectUser || !Myself)
            return null;
        
        /////////////////////////////////////////////////////////////////
        if (selectUser.id === Myself.id) // afficher mon profile
            return (
              <div>
                <div className="profile">
                    <input 
                        type="file" 
                        accept="image/*" 
                        id="avatarInput"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />
                    <img className="rounded-full w-30 h-30 mx-14" src={selectUser?.avatarUrl} onClick={() => document.getElementById('avatarInput')?.click()}></img>
                    {ActiveUpdate === 0 && ( // si il est pas en mode modifier
                        <div  className="bg-green-400">
                            <div className="text-3xl text-left truncate flex flex-col mt-2">
                                {selectUser?.username}
                                <br/>
                                {selectUser?.email}
                            </div>
                            <div className="bg-blue-600"><button onClick={onShow}>modifier</button></div>
                            
                        </div>
                    )}
                    {ActiveUpdate === 1 && ( // si il est en mode modifier
                        <div className="bg-green-400">
                            <form onSubmit={handleSubmit(handleUpdate)}>
                                <div className="flex flex-col gap-3">
                                    <CgProfile />
                                    <input {...(register("username", {onChange: () => {setErrMsg('')}}))} className="rounded-lg bg-gray-900"  type="text" placeholder={selectUser?.username}/>
                                        {errors.username && <p className="text-left text-red-500 text-xs">{`${errors.username.message}`}</p>}
                                    
                                    <CiMail />
                                    <input {...(register("email", {onChange: () => {setErrMsg('')}}))} className="rounded-lg bg-gray-900"  type="text" placeholder={selectUser?.email}/>
                                        {errors.email && <p className="text-left text-red-500 text-xs">{`${errors.email.message}`}</p>}
                                    <CiLock />
                                    <div className="relative">

                                    
                                        <input {...(register("password", {onChange: () => {setErrMsg('')}}))} className="rounded-lg bg-gray-900"  type={showPassword ? "text" : "password"} placeholder="Nouveau mot de pass"/>
                                            {/* {errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>} */}
                                        {showPassword ? (
                                            <LuEye className="absolute right-5 cursor-pointer"
                                                onClick={passwordVisibility} />
                                            ) : (
                                            <LuEyeClosed className="absolute right-5 cursor-pointer"
                                                onClick={passwordVisibility} />
                                            )}
                                            {errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>}
                                    </div>
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
        else //afficher profile des autres users
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

                    {/* //////////////////////////avatar + mon nom//////////////////////////////////// */}
                    <div className="box_me" onClick={()=>setSelectUser(Myself)}>
                        <div className="display_me">
                            <img className="rounded-full w-10 h-10" src={Myself?.avatarUrl}></img>
                            <span className="truncate">{Myself?.username}</span>
                        </div>
                    </div>

                     {/* //////////////////////////notifications//////////////////////////////////// */}
                    <div className="box_notif">
                        <div className="notif_msg">friend sent you a message</div>
                        <div className="notif_request">friend request</div>
                    </div>

                     {/* //////////////////////////liste des amis//////////////////////////////////// */}
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
            {/* /////////////////////////profile(moi ou user)/////////////////////////////////////// */}
            <div className="box_profile">
                {WhichProfile()}

             {/* //////////////////////////tableau des scores//////////////////////////////////// */}
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
