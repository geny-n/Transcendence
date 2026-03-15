import { useEffect, useState } from 'react';
import axios from "axios";
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TheSocket } from '../socket';
import { BiLogOut } from "react-icons/bi"; //logout icon
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_updateForm, updateForm } from '../lib/types';
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye, LuEyeClosed } from "react-icons/lu"; //eyes icon
import { CgProfile } from "react-icons/cg";//profile icon
import { FaPencil } from 'react-icons/fa6'; //pencil icon
import { CiCircleCheck } from "react-icons/ci"; //accepter icon
import { CiCircleRemove } from "react-icons/ci"; //refuser icon
import { CiSearch } from "react-icons/ci"; //search icon


import './style/Profile.css';

export default function Profile ()
{
    const {t} = useTranslation();
    const { socket } = TheSocket();

    const [lstFriends, setLstFriends] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    const [Myself, setMyself] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, password: string, createdAt: string} | null>(null);
    const [selectUser, setSelectUser] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string} | null>(null);
    
    const [watingRequest, setWatingRequest] = useState<string[]>([]);
    const [lstFriendship, setlstFriendship] = useState<{id: string, username: string, avatarUrl:string}[]>([]);
    const [isShowNotif, setisShowNotif] = useState(0);
    const [searchVal, setSeachVal] = useState(""); //reccuprer tout ce que le user tapper dans la barre de recherche
    const [getSearchVal, setGetSeachVal] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    // const [isShowFriendship, setisShowFriendship] = useState(0);
    // const [isShowMessages, setisShowMessages] = useState(0);

    const [ActiveUpdate, setActiveUpdate] = useState(0);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const passwordVisibility = () => setShowPassword(!showPassword);
    const [errMsgForm, setErrMsgForm] = useState<string>('');
    const [errMsgAvatar, setErrMsgAvatar] = useState<string>('');
    const logout_url = '/api/logout';
    const navigate = useNavigate();
    
    
    const handleSearch = async (event:React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSeachVal(value);
        try {
            const result = await axios.get(`/api/users/search?q=${value}`, {withCredentials:true});
            setGetSeachVal(result.data.users);
        }
        catch {}
    };


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
                // console.error('User not authenticated, redirecting to login...', error);
                // navigate('/login');
            }
        }
        fetchMe()
    }, []);


    const getFriend = async (myself = Myself) => {
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
            setLstFriends(friends);
        }
        catch(error) {
            console.error('Error fetch : ', error);
        }
    }

    useEffect(() => {//recuperer la liste des amis depuis le back 
        if (!Myself)
            return;
        getFriend();
    }, [Myself]);

    const IsFriend = (UserId:string) => {// parcour la liste d ami et retourne true si l id du user en question est dans la liste 
        return lstFriends.some((friend) => friend.id === UserId);
    }

    const DeleteFriend = async () => {
        if (!selectUser)
            return;
        try {
            await axios.delete(`/api/friends/${selectUser.id}`, {
                withCredentials: true,
            });
            setLstFriends(lstFriends.filter(friend => friend.id !== selectUser.id));
            setWatingRequest(prev => prev.filter(id => id !== selectUser.id));

        }
        catch {}
        
    }
    
    const AddFriend = async () => { //envoie une demande d ami et ajoute dans la bd friendship
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
        catch {}
    }

    

    // useEffect fetchMe — remplacer par :
// useEffect(() => {
//     const fakeMe = {
//         id: '1',
//         username: 'nnn',
//         avatarUrl: 'https://i.pravatar.cc/150?u=ngeny',
//         isOnline: true,
//         email: 'ngeny@g.com',
//         password: '',
//         createdAt: '2024-01-01'
//     };
//     setMyself(fakeMe);
//     setSelectUser(fakeMe);
// }, []);

// // useEffect fetchFriends — remplacer par :
// useEffect(() => {
//     if (!Myself) return;
//     setLstFriends([
//         { id: '2', username: 'Alice',   avatarUrl: 'https://i.pravatar.cc/150?u=alice',   isOnline: true,  email: 'alice@g.com',   createdAt: '2024-01-02' },
//         { id: '3', username: 'Bob',     avatarUrl: 'https://i.pravatar.cc/150?u=bob',     isOnline: false, email: 'bob@g.com',     createdAt: '2024-01-03' },
//         { id: '4', username: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=charlie', isOnline: true,  email: 'charlie@g.com', createdAt: '2024-01-04' },
//     ]);
// }, [Myself]);

// useEffect(() => {
//     if (!Myself) return;
//     setlstFriendship([
//         { id: 'r1', username: 'Alffffffffffffffffffffffffffice',   avatarUrl: 'https://i.pravatar.cc/150?u=alice' },
//         { id: 'r2', username: 'Bob',     avatarUrl: 'https://i.pravatar.cc/150?u=bob' },
//         { id: 'r3', username: 'Charlie', avatarUrl: 'https://i.pravatar.cc/150?u=charlie' },
//     ]);
// }, [Myself]);


// const [SearchResults, setSearchResults] = useState<{id: string, username: string, avatarUrl: string, isOnline: boolean, email: string, createdAt: string}[]>([
//     { id: '5', username: 'Dave',  avatarUrl: 'https://i.pravatar.cc/150?u=dave',  isOnline: true,  email: 'dave@g.com',  createdAt: '2024-01-05' },
//     { id: '6', username: 'Eve',   avatarUrl: 'https://i.pravatar.cc/150?u=eve',   isOnline: false, email: 'eve@g.com',   createdAt: '2024-01-06' },
//     { id: '7', username: 'Frank', avatarUrl: 'https://i.pravatar.cc/150?u=frank', isOnline: true,  email: 'frank@g.com', createdAt: '2024-01-07' },
// ]);

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
            //envoie les nouvelles valeurs au back si ca a change sinon ca envoie les enciennes pour ne pas envoyer de champs vides
            await axios.put('/api/users/me/', 
                {
                    username: data.username || selectUser.username,
                    email: data.email || selectUser.email,
                },
                {withCredentials: true}
            );
            if (data.currentPassword && data.newPassword) {
                await axios.post('/api/users/me/password', 
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
        const file = e.target.files; //liste des fichiers selectionnes 
        const formData = new FormData();//creer un conteneur vide 
        if (file)
            formData.append('avatar', file[0]);//met le fichier, si il exite, dans le conteneur pour que axios puisse l envoyer au back
        try {
            const res = await axios.put('/api/users/me/avatar', formData,  {headers: {"content-Type": "multipart/form-data"}, withCredentials: true});
            
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

    
    useEffect(() => {
        setActiveUpdate(0);
        setErrMsgForm('');
        setisShowNotif(0);
    }, [selectUser]);

    useEffect(() => {
        if (!socket || !Myself)
            return;
        const handleRequest = () => {
            axios.get('/api/friends/pending', { withCredentials: true })
            .then (result => {
                if (!result.data.success || !Array.isArray(result.data.requests)) {
                        throw Error(`Error API Friendship: ${result.status} ${result.statusText}`);
                    }
                    const requests = result.data.requests//reccupere toutes les demandes en attente envoyer et recu par le back
                    .filter((r:any) => r.receiverId === Myself.id)//selectionne que les demandes que je recu
                    .map((r: any) => ({
                        id: r.id,
                        username: r.sender.username,
                        senderId: r.senderId,
                        avatarUrl: r.sender.avatarUrl,
                    }));
                    setlstFriendship(requests);
            })
        }
        socket.on("friend:request_received", handleRequest);
        return () => {
            socket.off("friend:request_received", handleRequest);
        }
    }, [socket, Myself]);

    useEffect(() => {//recuperer la liste des demandes d amis depuis le back
        if (!Myself)
            return;
        const fetchRequestF = async () => {
            try {
                const result = await axios.get('/api/friends/pending', {
                    withCredentials: true,
                });
                if (!result.data.success || !Array.isArray(result.data.requests)) {
                    throw Error(`Error API Friendship: ${result.status} ${result.statusText}`);
                }
                const requests = result.data.requests//reccupere toutes les demandes en attente envoyer et recu par le back
                .filter((r:any) => r.receiverId === Myself.id)//selectionne que les demandes que je recu
                .map((r: any) => ({
                    id: r.id,
                    username: r.sender.username,
                    senderId: r.senderId,
                    avatarUrl: r.sender.avatarUrl,
                }));
                setlstFriendship(requests);
            }
            catch(error) {
                console.error('Error fetch : ', error);
            }
        }
        fetchRequestF();
    }, [Myself]);

    const AcceptRequest = async (requestId:string) => {//accepter les demandes d ami
        try {
            await axios.patch(`/api/friends/requests/${requestId}`,
                { action: 'accept' },
                { withCredentials: true}
            );
            setlstFriendship(lstFriendship.filter(r => r.id !== requestId));
            getFriend ();
        }
        catch {}
    }

    useEffect (() => {//voir l ami accepter sur ma page
        if (!socket || !Myself)
            return;
        const handleAccepted = () => {
            getFriend(Myself);
        }
        socket.on("friend:request_accepted", handleAccepted);
        return () => {
            socket.off("friend:request_accepted", handleAccepted);
        }
    }, [socket, Myself]);

    useEffect (() => {//quand je supprime quelau un je disparait de sa page
        if (!socket || !Myself)
            return;
        const handleDelete = () => {
            getFriend(Myself);
        }
        socket.on("friend:unfriended", handleDelete);
        return () => {
            socket.off("friend:unfriended", handleDelete);
        }
    }, [socket, Myself]);

    useEffect (() => {
        if (!socket)
            return;
        const handleDenied = (data : {requestId:string; userId:string}) => {
            setWatingRequest(prev => prev.filter(id => id !== data.userId));
        }

        // socket.on("friend:request_rejected", (data {requestId:string; userId:string});
        socket.on("friend:request_rejected", handleDenied);
        return () => {
            socket.off("friend:request_rejected", handleDenied);
        }
    }, [socket]);

    const DenieRequest = async (requestId:string) => {//refuser les demandes d ami
        try {
            await axios.patch(`/api/friends/requests/${requestId}`,
                { action: 'reject' },
                { withCredentials: true}
            );
            setlstFriendship(lstFriendship.filter(r => r.id !== requestId));
        }
        catch {}
    }

    const ShowNotif = () => {
        // reset({username: selectUser?.username, email:selectUser?.email, currentPassword:'', newPassword:''});//pre remplir les champs par les avaleurs actuelles 
        setisShowNotif(1);
    }

    const WhichProfile = () => {
        if (!selectUser || !Myself)
            return null;
        
        /////////////////////////////////////////////////////////////////
        console.log('selectUser.createdAt:', selectUser?.createdAt);
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
                                <div className="justify-self-end self-end text-right ">{t('profile.datecreate')} <br/> {new Date(selectUser?.createdAt).toLocaleDateString('fr-FR')}</div>
                            </>
                        )}
                        {ActiveUpdate === 1 && ( // si il est en mode modifier
                            <div className="box_form">
                                <div className="form">
                                    <form onSubmit={handleSubmit(handleUpdate)}>
                                        <div className="box_input_form">
                                            <div className="input_form">

                                                <CgProfile />
                                                <input {...(register("username", {onChange: () => {setErrMsgForm('')}}))}
                                                    type="text"
                                                    placeholder={selectUser?.username}
                                                    className="input"/>
                                            </div>
                                            {errors.username && <p className="error_input">{`${errors.username.message}`}</p>}

                                            <div className="input_form">
                                                <CiMail />
                                                <input {...(register("email", {onChange: () => {setErrMsgForm('')}}))}
                                                    type="text"
                                                    placeholder={selectUser?.email}
                                                    className="input"/>
                                            </div>
                                            {errors.email && <p className="error_input">{`${errors.email.message}`}</p>}

                                            <div className="input_form">
                                                <CiLock />
                                                <input {...(register("currentPassword", {onChange: () => {setErrMsgForm('')}}))}
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t('profile.actuelmdp')}
                                                    autoComplete="new-password"
                                                    className="input"/>
                                                
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
                                                <input {...(register("newPassword", {onChange: () => {setErrMsgForm('')}}))} 
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder={t('profile.newmdp')}
                                                    className="input"/>
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
                    <div className="justify-self-end self-end text-right ">{t('profile.datecreate')} <br/> {new Date(selectUser?.createdAt).toLocaleDateString('fr-FR')}</div>
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
                    {/* //////////////////////////avatar + mon nom//////////////////////////////////// */}
                    <div className="box_me" onClick={()=>setSelectUser(Myself)}>
                        <div className="display_me">
                            <img className="rounded-full w-10 h-10" src={Myself?.avatarUrl}></img>
                            <span className="truncate">{Myself?.username}</span>
                        </div>
                    </div>

                     {/* //////////////////////////notifications//////////////////////////////////// */}
                    <div className="box_notif">
                    <div className="input_form">
                        <input placeholder={t('profile.search')}
                            value={searchVal}
                            onChange={handleSearch}
                            className="input"/>
                            
                            <CiSearch className="icon"/>
                    </div>

                        <ul>
                            {
                                searchVal && (
                                    //SearchResults.filter((user) => user.username.includes(searchVal))//filtre les donnes et va afficher que les valeurs qui correspondent a linput
                                    getSearchVal.map((user) =>
                                        <li key={user.id} onClick={() => 
                                            {setSeachVal(''); setSelectUser(user); setGetSeachVal([]);}}>
                                            {user.username}
                                        </li>)//parcour le tableau filte et affiche dans li
                                )
                            }
                        </ul>
                        <button className="notif" onClick={ShowNotif}>{t('profile.notification')}</button>
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
            {/* /////////////////////////profile(moi ou user) + notif/////////////////////////////////////// */}
            <div className="box_profile">
                {isShowNotif === 1 ? (
                    <div className="show_notif">
                        <div className="">
                            <div className="title_notif">{t('profile.newMessage')}</div>
                            <div className="p-3">
                                {lstFriendship.map((theRequest) => (
                                    <div className="items" key={theRequest.id}>
                                        <img className="avatar_notif" src={theRequest.avatarUrl}></img>
                                        <span className="username_notif">{theRequest.username}</span>
                                        <span className="msg_counter">10</span>
                                    </div>
                                ))}
                            </div>

                        </div>
                        <div>

                            <div className="title_notif">{t('profile.friendRequest')}</div>
                            <div className="p-3">
                                {lstFriendship.map((theRequest) => (
                                    <div className="items" key={theRequest.id}>
                                        <img className="avatar_notif" src={theRequest.avatarUrl}></img>
                                        <span className="username_notif">{theRequest.username}</span>
                                        <div className="box_icon">
                                            <button onClick = {() => AcceptRequest(theRequest.id)}><CiCircleCheck className="icon_notif"/></button>
                                            <button onClick = {() => DenieRequest(theRequest.id)}><CiCircleRemove className="icon_notif"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* <div className="bg-red-900 overflow-auto flex gap-5 p-2">
                            <div className="bg-green-900 p-2 rounded-lg">
                                <button onClick={ShowMessages}>Nouveaux messages</button>
                            </div>
                            <div className="bg-green-700 rounded-lg">
                                <button onClick={ShowFriendship}>demande d amis</button>
                            </div>
                             
                        </div>
                        <div className="bg-gray-900">
                            {isShowFriendship === 1 && (
                                <div>
                                    {lstFriendship.map((theRequest) => (
                                        <div className="flex gap-10" key={theRequest.id}>
                                            <img className="rounded-full w-9 h-9" src={theRequest.avatarUrl}></img>
                                            <span className="truncate">{theRequest.username}</span>
                                            <button onClick = {() => AcceptRequest(theRequest.id)}>accepter</button>
                                            <button onClick = {() => DenieRequest(theRequest.id)}>refuser</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {isShowMessages === 1 && (
                                <div>voici la liste des nouveaux </div>
                            )}
                        </div> */}
                    </div>
                ) : (
                    <>
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
                    </>
                )}
            </div>
            
        </div>
    )
}
