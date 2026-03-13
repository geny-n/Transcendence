import { useEffect, useState } from 'react';
import axios from "axios";
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { BiLogOut } from "react-icons/bi"; //logout icon
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_updateForm, updateForm } from '../lib/types';
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye, LuEyeClosed } from "react-icons/lu"; //eyes icon
import { CgProfile } from "react-icons/cg";//profile icon
import { FaPencil } from 'react-icons/fa6'; //pencil icon
import './style/Profile.css';

export default function Profile ()
{
    const {t} = useTranslation();
    const [lstFriends, setLstFriends] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    const [Myself, setMyself] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, password: string, createdAt: string} | null>(null);
    const [selectUser, setSelectUser] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, password?: string, createdAt: string} | null>(null);
    
    const [watingRequest, setWatingRequest] = useState<string[]>([]);
    // const [lstRequest, setlstRequest] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean}[]>([]);

    const [ActiveUpdate, setActiveUpdate] = useState(0);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const passwordVisibility = () => setShowPassword(!showPassword);
    const [errMsgForm, setErrMsgForm] = useState<string>('');
    const [errMsgAvatar, setErrMsgAvatar] = useState<string>('');
    const logout_url = '/api/logout';
    const navigate = useNavigate();
    
    const [SearchResults, setSearchResults] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    const [query, setQuery] = useState<string>('');


    const handleLogout = async () =>{
        try{
            await axios.get(logout_url);
            localStorage.removeItem("token");
            console.log("User logout successfull");
            navigate("/");
        }catch(error){
            console.log("Erreur logout: ", error);
        }
    };

    // useEffect(() => {//recuperer mes informations
    //     const fetchMe = async () => {
    //         try {
    //             const response = await axios.get('/api/users/me', {
    //                 withCredentials:true
    //             });
    //             if (!response.data.success) {
    //                 throw Error(`Error API Me: ${response.status} ${response.statusText}`);
    //             }
    //             setMyself(response.data.user);
    //             setSelectUser(response.data.user);
                
    //         }
    //         catch(error) {
    //             console.error('User not authenticated, redirecting to login...', error);
    //             // navigate('/login');
    //         }
    //     }
    //     fetchMe()
    // }, []);




    // useEffect(() => {//recuperer la liste des amis depuis le back 
    //     if (!Myself)
    //         return;
    //     const fetchFriends = async () => {
    //         try {
    //             const result = await axios.get('/api/friends', {
    //                 withCredentials: true,
    //             });
    //             if (!result.data.success || !Array.isArray(result.data.friends)) {
    //                 throw Error(`Error API Friends: ${result.status} ${result.statusText}`);
    //             }
    //             const friends = result.data.friends.map((f: any) => {
    //                 // [
    //                 //     { "user1": { "id": "moi", ... }, "user2": { "id": "ami1", ... } },
    //                 //     { "user1": { "id": "ami2", ... }, "user2": { "id": "moi", ... } }
    //                 // ]
    //                 if (f.user1.id === Myself.id)
    //                     return f.user2;
    //                 else
    //                     return f.user1;
                    
    //             });
    //             setLstFriends(friends);
    //         }
    //         catch(error) {
    //             console.error('Error fetch : ', error);
    //         }
    //     }
    //     fetchFriends();
    // }, [Myself]);

    const IsFriend = (UserId:string) => {
        return lstFriends.some((friend) => friend.id === UserId);
    }

    const DeleteFriend = async () => {
        if (!selectUser)
            return;
        try {
            await axios.delete(`/api/friends/${selectUser.id}`, {
                withCredentials: true,
            });
            setLstFriends(lstFriends.filter(friend => friend.id !== selectUser.id))
        }
        catch {

        }
        
    }
    
    const AddFriend = async () => {
        if (!selectUser)
            return;
        try {
            await axios.post(`/api/friends/requests`,
                { receiverId: selectUser.id },
                { withCredentials: true }
        );
            // setLstFriends([...lstFriends, selectUser]);
            setWatingRequest([...watingRequest, selectUser.id]);
        }
        catch {

        }
    }

    

    // useEffect fetchMe — remplacer par :
useEffect(() => {
    const fakeMe = {
        id: '1',
        username: 'nnn',
        avatarUrl: 'https://i.pravatar.cc/150?u=ngeny',
        isOnline: true,
        email: 'ngeny@g.com',
        password: '',
        createdAt: '2024-01-01'
    };
    setMyself(fakeMe);
    setSelectUser(fakeMe);
}, []);

// useEffect fetchFriends — remplacer par :
useEffect(() => {
    if (!Myself) return;
    setLstFriends([
        { id: '2', username: 'Alice',   avatarUrl: 'https://i.pravatar.cc/150?u=alice',   isOnline: true,  email: 'alice@g.com',   createdAt: '2024-01-02' },
        { id: '3', username: 'Bob',     avatarUrl: 'https://i.pravatar.cc/150?u=bob',     isOnline: false, email: 'bob@g.com',     createdAt: '2024-01-03' },
        { id: '4', username: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=charlie', isOnline: true,  email: 'charlie@g.com', createdAt: '2024-01-04' },
    ]);
}, [Myself]);

    const searchUser = async () => {
        try {
            const res = await axios.get(`/api/users/search?q=${query}`, { withCredentials: true });
            setSearchResults(res.data.users);
        } catch (error) {
            console.error('Erreur recherche :', error);
        }
    }
    const { // retourne des outils pour gerer le formulaire
        register, //faire le lien avec le input du form
        handleSubmit, // valide les champs avec zod si error envoie le message d erreur 
        reset,
        formState: {errors}
      } = useForm<T_updateForm>({//dit a react-hook-form d utiliser le schema zod pour valider les champs
        resolver: zodResolver(updateForm), 
    });

    const onShow = () => {
        reset({username: selectUser?.username, email:selectUser?.email, currentPassword:'', newPassword:''});//pre remplir les champs par les avaleurs actuelles 
        setActiveUpdate(1);
    }

    const handleUpdate = async (data:T_updateForm) => { // modification des donnes et maj dans la bd
        if (!selectUser || !Myself)
            return;
        //envoie une requete PUT au back favec les nouvelles valeurs et met a jour la BD 
        try {
            await axios.put('/api/users/me/', 
                {
                    username: data.username || selectUser.username,
                    email: data.email || selectUser.email,
                },
                {withCredentials: true}
            );
            if (data.currentPassword && data.newPassword) {
                await axios.put('/api/users/me/password', 
                    {currentPassword: data.currentPassword, newPassword: data.newPassword},
                    {withCredentials: true}
                );
            }
            setErrMsgForm("");
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
                    setErrMsgForm(t('profile.err.data'))
                if (err.response?.status == 401)
                    setErrMsgForm(t('profile.err.wrongPassword'))
            }
        }
    }

//    https://blog.stackademic.com/uploading-files-with-react-post-request-dd6c1eebe933
    const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files;
        const formData = new FormData();
        if (file)
        {
            formData.append('avatar', file[0]);
            // setUploadAvatar(file[0]);
            // setPrevAvatar(URL.createObjectURL(file));
        }
        try {
            const res = await axios.put('/api/users/me/avatar', formData,  {headers: {"content-Type": "multipart/form-data"}, withCredentials: true});
            // setUploadAvatar(null);
            //permet de voir la modification dans le front
            setSelectUser({
                ...selectUser!, avatarUrl:res.data.avatarUrl || selectUser?.avatarUrl
            });
            setMyself({
                ...Myself!, avatarUrl:res.data.avatarUrl || Myself?.avatarUrl
            });
        }
        catch(err) 
        {
            if (axios.isAxiosError(err)) 
            {
                setErrMsgAvatar(t('profile.err.avatar'))
            }
        }
        
    };

    const WhichProfile = () => {
        if (!selectUser || !Myself)
            return null;
        
        /////////////////////////////////////////////////////////////////

        if (selectUser.id === Myself.id) // afficher mon profile
            return (
                <div>
                    <div className="profile_banner">
                    
                        {/* modifier avatar*/}
                        <input
                            id="getAvatar"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatar}
                        />
                        <div className="box_avatar">
                            {/* <div className="w-30 pl-1 "> */}
                                <img className="avatar" src={selectUser?.avatarUrl}></img>
                                <button type="button" className="avatar_btn" onClick={() => document.getElementById('getAvatar')?.click()}><FaPencil size={20}/></button>
                                {errMsgAvatar && <p className="error_input">{errMsgAvatar}</p>}
                            {/* </div> */}
                        </div>

                        {/* https://medium.com/@denis.mutunga/uploading-images-to-the-backend-in-react-with-formdata-c8035ae64a0c*/}                    
                        {ActiveUpdate === 0 && ( // si il est pas en mode modifier
                            <>
                                <div className="box_data">
                            
                                    <div /* className="text-center" */>
                                        <h1 className="data_txt_username">{selectUser?.username}</h1>
                                        <p className="data_txt_email">{selectUser?.email}</p>
                                    </div>
                                        
                                    <div className="flex gap-4">
                                        <button className="data_btn px-6" onClick={onShow}>{t('profile.modifier')}</button>
                                        <button className="data_btn px-2" onClick={handleLogout}> {t('profile.deconnecion')} 
                                            <BiLogOut className="w-5 h-5 shrink-0"/>
                                        </button>
                                    </div>
                                </div>
                                <div className="justify-self-end self-end text-right ">{t('profile.datecreate')} <br/> {selectUser?.createdAt}</div>
                            </>
                        )}
                        {ActiveUpdate === 1 && ( // si il est en mode modifier
                            <div className="box_form">
                                <div className="form">
                                    <form onSubmit={handleSubmit(handleUpdate)}>
                                        <div className="box_input_form">
                                            <div className="input_form">

                                                <CgProfile />
                                                <input {...(register("username", {onChange: () => {setErrMsgForm('')}}))} type="text" placeholder={selectUser?.username}/>
                                            </div>
                                            {errors.username && <p className="error_input">{`${errors.username.message}`}</p>}

                                            <div className="input_form">
                                                <CiMail />
                                                <input {...(register("email", {onChange: () => {setErrMsgForm('')}}))} type="text" placeholder={selectUser?.email}/>
                                            </div>
                                            {errors.email && <p className="error_input">{`${errors.email.message}`}</p>}

                                            <div className="input_form">
                                                <CiLock />
                                                <input {...(register("currentPassword", {onChange: () => {setErrMsgForm('')}}))}  type={showPassword ? "text" : "password"} placeholder={t('profile.actuelmdp')}/>
                                                    {/* {errors.password && <p className="error_input">{`${errors.password.message}`}</p>} */}
                                                {showPassword ? (
                                                    <LuEye className="icon"
                                                    onClick={passwordVisibility} />
                                                ) : (
                                                    <LuEyeClosed className="icon"
                                                    onClick={passwordVisibility} />
                                                )}
                                            </div>
                                            {errors.currentPassword && <p className="error_input">{`${errors.currentPassword.message}`}</p>}
                                            
                                            <div className="input_form">
                                                <CiLock />
                                                <input {...(register("newPassword", {onChange: () => {setErrMsgForm('')}}))}  type={showPassword ? "text" : "password"} placeholder={t('profile.newmdp')}/>
                                                    {/* {errors.password && <p className="error_input">{`${errors.password.message}`}</p>} */}
                                                {showPassword ? (
                                                    <LuEye className="icon"
                                                    onClick={passwordVisibility} />
                                                ) : (
                                                    <LuEyeClosed className="icon"
                                                    onClick={passwordVisibility} />
                                                )}
                                            </div>
                                            {errors.newPassword && <p className="error_input">{`${errors.newPassword.message}`}</p>}
                                            
                                            {errMsgForm && <p className="error_input">{errMsgForm}</p>}
                                        </div>
                                        <div className="box_btn_form">
                                            <button className="btn_save" type="submit">{t('profile.save')}</button>
                                            <button className="btn_cancel" type="button" onClick={() => {setActiveUpdate(0); setErrMsgForm('');}}>{t('profile.annule')}</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    
                </div>
              </div> 
            );
        /////////////////////////////////////////////////////////////////
        else //afficher profile des autres users
            return (
                <div className="profile_banner">
                    <img className="avatar" src={selectUser?.avatarUrl}></img>
                    {/* <div className="text-3xl text-left truncate flex flex-col mt-7"> */}
                        <div className="box_data">
                            <div>
                                <h1 className="data_txt_username">{selectUser?.username}</h1>
                                <p className="data_txt_email">{selectUser?.email}</p>
                            </div>
                            {IsFriend(selectUser?.id) ? (
                                <button className="delete_btn" onClick={DeleteFriend}>{t('profile.delete')}</button>
                            ) : watingRequest.includes(selectUser.id) ? (
                                <button className="pending_btn" disabled>{t('profile.pending')}</button>
                            ) : (
                                <button className="add_btn" onClick={AddFriend}>{t('profile.add')}</button>
                            )}
                            
                        </div>
                    <div className="justify-self-end self-end text-right ">{t('profile.datecreate')} <br/> {selectUser?.createdAt}</div>
                </div>

                //ajouter bouton supprimer ami si c est un ami sinon addfriend
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
                <div className="box_search">
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchUser()}
                    />
                    <button onClick={searchUser}>🔍</button>

                    {SearchResults.map((user) => (
                        <div key={user.id} onClick={() => {
                            setSelectUser(user);
                            setSearchResults([]); // ferme les résultats après sélection
                            setQuery('');
                        }}>
                            <img className="rounded-full w-8 h-8" src={user.avatarUrl} />
                            <span>{user.username}</span>
                            </div>
                    ))}
                </div>      

                    {/* //////////////////////////avatar + mon nom//////////////////////////////////// */}
                    <div className="box_me" onClick={()=>setSelectUser(Myself)}>
                        <div className="display_me">
                            <img className="rounded-full w-10 h-10" src={Myself?.avatarUrl}></img>
                            <span className="truncate">{Myself?.username}</span>
                        </div>
                    </div>

                     {/* //////////////////////////notifications//////////////////////////////////// */}
                    <div className="box_notif">
                        <button className="notif">Notifications</button>
                        {/* <div className="notif_request">friend request</div> */}
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
                        <div className="w-1/3">{t('profile.opponent')}</div>
                        <div className="w-1/3">{t('profile.result')}</div>
                        <div className="w-1/3">{t('profile.score')}</div>
                        <div className="w-1/3">{t('profile.time')}</div>
                        <div className="w-1/3">{t('profile.date')}</div>
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
