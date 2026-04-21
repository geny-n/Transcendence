import { useEffect, useState } from 'react';
import axios from "axios";
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { TheSocket } from '../socket';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_updateForm, updateForm } from '../lib/types';
import { CiCircleInfo } from "react-icons/ci";//info icon
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye, LuEyeClosed } from "react-icons/lu"; //eyes icon
import { CgProfile } from "react-icons/cg";//profile icon
import { FaPencil } from 'react-icons/fa6'; //pencil icon
import { CiCircleCheck } from "react-icons/ci"; //accepter icon
import { CiCircleRemove } from "react-icons/ci"; //refuser icon
import { CiSearch } from "react-icons/ci"; //search icon
import { IoIosArrowBack } from "react-icons/io"; //return icon
import { useAuth } from '../main';
import useUser, { defaultAvatar, AvatarErrorLoad } from '../lib/user';
import Cropper, { type Area } from 'react-easy-crop';
import './style/Profile.css';

export default function Profile ()
{
	const {t} = useTranslation();
	const { socket } = TheSocket();
	const { setAccessToken, setUser: setAuthUser } = useAuth();

    const Myself = useUser (state => state.userMyself);
    const fetchMe = useUser (state => state.fetchMe);
    
    const lstFriends = useUser (state => state.userFriends);
    const getFriend = useUser (state => state.fetchFriends);

    const initSocket = useUser (state => state.initsocket);

    const [selectUser, setSelectUser] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string, level?: number, experience?: number} | null>(null);
    const [lstFriendship, setlstFriendship] = useState<{id: string, username: string, avatarUrl:string}[]>([]);
    const [isShowNotif, setisShowNotif] = useState(0);
    const [searchVal, setSearchVal] = useState(""); //reccuprer tout ce que le user tapper dans la barre de recherche
    const [getSearchVal, setGetSeachVal] = useState<{id: string, username: string, avatarUrl:string, isOnline: boolean, email: string, createdAt: string}[]>([]);
    
    const waitingRequest = useUser (state => state.waitingRequest);
    const notifMsgUnread = useUser (state => state.NotifMsgUnread);
    const count_notif = notifMsgUnread.length + lstFriendship.length;
    
    const [responsive, setResponsive] = useState(false);
    const [ActiveUpdate, setActiveUpdate] = useState(0);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const passwordVisibility = () => setShowPassword(!showPassword);

    const [errMsgForm, setErrMsgForm] = useState<string>('');
    const [errMsgAvatar, setErrMsgAvatar] = useState<string>('');
    const [errlogout, setLogout] = useState<string>('');
    
    const logout_url = '/api/logout';
    const navigate = useNavigate();

  
    useEffect(() => {//recuperer mes informations
        fetchMe().then(user => {
            if (!user)
                navigate('/login');
            else
                setSelectUser(user);
        });
    }, []);

    useEffect (() => {
        if (!socket)
            return;
        initSocket(socket);
    }, [socket]);

    useEffect(() => {
        if (!selectUser || !Myself)
            return;
        if (selectUser.id === Myself.id)
        {
            setSelectUser(Myself);
            return;
        }
        const update = lstFriends.find(f => f.id === selectUser.id);
        if (update)
            setSelectUser(prev => prev ? {
                ...prev,
                isOnline: update.isOnline,
                username: update.username,
                email: update.email,
                avatarUrl: update.avatarUrl,
            } : prev);  
    }, [lstFriends, Myself]);

    const handleSearch = async (event:React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchVal(value);
        if (value.length < 2) {
            setGetSeachVal([]);
            return;
        }
        try {
            const result = await axios.get(`/api/users/search?q=${value}`, {withCredentials:true});
            setGetSeachVal(result.data.users);
        }
        catch {
            setGetSeachVal([]);
        }
    };

    const handleLogout = async () =>{
        try{
            await axios.get(logout_url, { withCredentials: true });
            localStorage.removeItem("token");
            setAccessToken(null);
            setAuthUser(null);
            console.log("User logout successfull");
            navigate("/");
        }catch(error){
            setLogout('Error logout');
        }
    };

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
            useUser.setState(state => ({
                userFriends : lstFriends.filter(friend => friend.id !== selectUser.id),
                waitingRequest : state.waitingRequest.filter(id => id !== selectUser.id)
            }));
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
            useUser.setState(state => ({
                waitingRequest: [...state.waitingRequest, selectUser.id]
            }));
        }
        catch {}
    }

    const { // retourne des outils pour gerer le formulaire
        register, //faire le lien avec le input du form
        handleSubmit, // valide les champs avec zod si error envoie le message d erreur 
        reset,
        formState: {errors}
      } = useForm<T_updateForm>({//dit a la librairie react-hook-form d utiliser le schema zod pour valider les champs
        resolver: zodResolver(updateForm(t)), 
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
            useUser.setState({ userMyself: {
                ...Myself, username:data.username || Myself.username, 
                    email:data.email || Myself.email
            }});
            setActiveUpdate(0);
        }
        catch(err) 
        {
            if (axios.isAxiosError(err)) 
            {
                const errMsg = err.response?.data?.message;
                if (err)
                if (errMsg)
                    setErrMsgForm(t(errMsg));
                else
                    setErrMsgForm(t('backend.common.internal.server.error'));
            }
        }
    }


    const [image, setImage] = useState("");
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [crop, setCrop] = useState({x:0, y:0});
    const [zoom, setZoom] = useState(1);

    const imgCroppedComplete = (_croppedArea:Area, croppedAreaPixels:Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }

    const selectAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; //liste des fichiers selectionnes
        if (!file)
            return;
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            setImage(reader.result as string);
        });
        reader.readAsDataURL(file);
    };

    const getCroppedImg = async ( image:string , pixelcrop:Area): Promise<Blob | null> => {
        const img = new Image();
        img.src = image;
        await new Promise(res => {img.onload = res; });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = pixelcrop.width;
        canvas.height = pixelcrop.height;
        if (!ctx)
            return null;
        ctx.drawImage(
            img,
            //quoi prendre de l image
            pixelcrop.x,
            pixelcrop.y,
            pixelcrop.width,
            pixelcrop.height,

            //ou sur le canvas
            0, 0,
            pixelcrop.width,
            pixelcrop.height,

        );

        return new Promise<Blob | null>(resolve => canvas.toBlob(b => resolve(b), 'image/jpeg'));
        
    }
    const handleAvatar = async () => {
        if (!image || !croppedAreaPixels)
            return;
        try {
            const blob = await getCroppedImg(image, croppedAreaPixels);
            if (!blob)
                return;
            const formData = new FormData();//creer un conteneur vide 
        
            formData.append('avatar', blob, 'avatar.jpg');//met le fichier, si il exite, dans le conteneur pour que axios puisse l envoyer au back
        
            const res = await axios.put('/api/users/me/avatar', formData,  {headers: {"content-Type": "multipart/form-data"}, withCredentials: true});
            // permet de voir la modification dans le front
            setSelectUser({
                ...selectUser!, avatarUrl:res.data.avatarUrl || selectUser?.avatarUrl
            });
            useUser.setState({userMyself : {
                ...Myself!, avatarUrl:res.data.avatarUrl || Myself?.avatarUrl
            }});
            setImage("")
        }
        catch(err) 
        {
            if (axios.isAxiosError(err)) 
            {
                setErrMsgAvatar(t('profile.err.avatar'))
            }
        }
        
    };

    const ErrorAvatar = async (e:React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        if (img.src.endsWith(defaultAvatar))
            return;
        img.src = defaultAvatar;
        if (selectUser?.id === Myself?.id) {
            try {
                const blob = await fetch(defaultAvatar).then(r => r.blob());
                const formData = new FormData();//creer un conteneur vide 
            
                formData.append("avatar", blob, "default_avatar.jpg");//met le fichier, si il exite, dans le conteneur pour que axios puisse l envoyer au back
                
                const res = await axios.put('/api/users/me/avatar', formData,  {headers: {"content-Type": "multipart/form-data"}, withCredentials: true});
                const newUrl = res.data.avatarUrl ?? defaultAvatar;
                setSelectUser(prev => prev ? { ...prev, avatarUrl: newUrl} : prev);
                useUser.setState(state => ({ userMyself: state.userMyself ? { ...state.userMyself, avatarUrl: newUrl}: null, }));
            }
            catch {}
        }
    }

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
        const handleProfile = async (data: { userId: string }) => {
            if (!selectUser || selectUser.id === Myself.id || data.userId !== selectUser.id)
                return;
            try
            {
                await axios.get(`/api/users/${data.userId}`, {withCredentials: true});
            }
            catch (err)
            {
                if (axios.isAxiosError(err) && err.response?.status === 404)
                    setSelectUser(Myself);
            }
        }

        socket.on("friend:request_received", handleRequest);
        socket.on("friend:profile_updated", handleProfile);
        return () => {
            socket.off("friend:request_received", handleRequest);
            socket.off("friend:profile_updated", handleProfile);
        }
    }, [socket, Myself, selectUser]);

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
                console.log('Error fetch : ', error);
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

    useEffect (() => {
        if (!socket)
            return;
        const handleDenied = (data : {requestId:string; userId:string}) => { //recupere les datas envoyer par le back
            useUser.setState(state => ({
                waitingRequest: state.waitingRequest.filter(id => id !== data.userId)
            }));
        }
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
        setisShowNotif(1);
        setResponsive(true);
    }

    const status = (isOnline: boolean) => {
        if (isOnline)
            return "bg-emerald-500";
        return "bg-gray-300";
    }

    const matchWins = (Myself?.matchWins ?? [])?.map((m) => ({
        ...m,
        result: 'win',
        opponent: m.loserLabel
    }));

    const matchLosses = (Myself?.matchLosses ?? [])?.map((m) => ({
        ...m,
        result: 'loose',
        opponent: m.winnerLabel
    }));

    const MyMatches = [...matchWins, ...matchLosses];

    const WhichProfile = () => {
        if (!selectUser || !Myself)
            return null;
        
        /////////////////////////////////////////////////////////////////
        
        if (selectUser.id === Myself.id) // afficher mon profil
            return (
                <div>
                    <div className="profile_banner">             
                        {ActiveUpdate === 0 && ( // si il est pas en mode modifier
                            <>
                                {image && (
                                    <div className="avatar_choose_box">
                                        <div className="avatar_choose_crop">
                                            <Cropper
                                                image={image}
                                                crop={crop}
                                                zoom={zoom}
                                                aspect={1}
                                                cropShape="round"
                                                onCropChange={setCrop}
                                                onCropComplete={imgCroppedComplete}
                                                onZoomChange={setZoom}
                                            />
                                        </div>
                                        <div className='flex gap-4'>
                                            <button className="avatar_choose_btn bg-green-500 hover:bg-green-700 transition" onClick={handleAvatar}>Save</button>
                                            <button className="avatar_choose_btn bg-red-500 hover:bg-red-700 transition" onClick={() => setImage("")}>Annuler</button>
                                        </div>
                                    </div>
                                )}    
                                    <input
                                        id="getAvatar"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={selectAvatar}
                                    />
                                    
                                
                                
                                <div className="box_avatar">
                                    <div title= {`${t('profile.datecreate')} \n ${new Date(selectUser?.createdAt).toLocaleDateString('fr-FR')}`}>
                                        <CiCircleInfo  className="w-6 h-6"/>
                                    </div>
                                        <img className="avatar"
                                            src={selectUser?.avatarUrl} onError={AvatarErrorLoad}
                                        ></img>
                                        <button type="button" className="avatar_btn" onClick={() => document.getElementById('getAvatar')?.click()}><FaPencil size={20}/></button>
                                        {errMsgAvatar && <p className="error_input">{errMsgAvatar}</p>}
                                </div>

                                <div className="box_data">
                                    <div>
                                        <h1 className="data_txt_username">{selectUser?.username}</h1>
                                        <p className="data_txt_email">{selectUser?.email}</p>
                                        {selectUser?.level !== undefined && (
                                            <div className="flex gap-4 text-sm text-slate-400 mt-2">
                                                <span>{t('profile.levelText')}: <span className="font-bold text-purple-300">{selectUser.level}</span></span>
                                                <span>{t('profile.xpText')}: <span className="font-bold text-indigo-300">{selectUser.experience}</span></span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-4 w-full items-center  justify-center">
                                        <button className="data_btn px-6" onClick={onShow}>{t('profile.modifier')}</button>
                                        <button className="data_btn " onClick={handleLogout}> {t('profile.deconnecion')}</button>
                                        {errlogout && <p className="error_input">{errlogout}</p>}
                                    </div>
                                </div>
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
                    <div className="box_avatar">
                        <div title= {`${t('profile.datecreate')} \n ${new Date(selectUser?.createdAt).toLocaleDateString('fr-FR')}`}>
                            <CiCircleInfo  className="w-6 h-6"/>
                        </div>
                        <img className="avatar" src={selectUser?.avatarUrl} onError={ErrorAvatar}></img>    
                    </div>
                    <div className="box_data">
                        <div>
                            <h1 className="data_txt_username">{selectUser?.username}</h1>
                            <p className="data_txt_email">{selectUser?.email}</p>
                            {selectUser?.level !== undefined && (
                                <div className="flex gap-4 text-sm text-slate-400 mt-2">
                                    <span>{t('profile.levelText')}: <span className="font-bold text-purple-300">{selectUser.level}</span></span>
                                    <span>{t('profile.xpText')}: <span className="font-bold text-indigo-300">{selectUser.experience}</span></span>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4 w-full items-center justify-center">
                            {IsFriend(selectUser?.id) ? (
                                <button className="delete_btn" onClick={DeleteFriend}>{t('profile.delete')}</button>
                            ) : waitingRequest.includes(selectUser.id) ? (
                                    <button className="pending_btn" disabled>{t('profile.pending')}</button>
                            ) : (
                                    <button className="add_btn" onClick={AddFriend}>{t('profile.add')}</button>
                            )}
                        </div>            
                    </div>
                </div>
            );
    }

    return (
        <div className="all_screen">
            <div className={`left ${responsive ? 'hidden md:flex' : 'flex w-full md:w-50 md:shrink-0'}`}>
                {/* //////////////////////////avatar + mon nom//////////////////////////////////// */}
                <div className="box_me" onClick={()=>{setSelectUser(Myself); setResponsive(true); setActiveUpdate(0); setisShowNotif(0)}}>
                    <div className="display_me">
                        <img className="rounded-full w-10 h-10" src={Myself?.avatarUrl} onError={ErrorAvatar}></img>
                        <span className="truncate">{Myself?.username}</span>
                    </div>
                </div>
                 {/* //////////////////////////notifications//////////////////////////////////// */}
                <div className="box_notif">
                    <button className="notif" onClick={ShowNotif}>
                        {t('profile.notification')}
                        {count_notif > 0 && (
                            <div className="indicator_notif"></div>
                        )}
                    </button>
                    <div className="relative">
                        <div className="input_form">
                            <input placeholder={t('profile.search')}
                                value={searchVal}
                                onChange={handleSearch}
                                className="search_input"
                                />
                                
                                <CiSearch className="icon"/>
                        </div>
                        { searchVal && (
                            <ul className="search_val_box">
                                {getSearchVal.map((user) =>
                                    <li 
                                        key={user.id}
                                        className="search_val"
                                        onClick={() => {
                                            setSearchVal('');
                                            setSelectUser(user);
                                            setGetSeachVal([]);
                                            setResponsive(true);
                                        }}
                                    >
                                        {user.username}
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                    
                </div>
                {/* //////////////////////////liste des amis//////////////////////////////////// */}
                <div className="box_lst_friend">
                    {lstFriends.map((theFriend, idx) => (
                        <div className="display_friends" key={idx}
                            onClick={async () => {
                                const result = await axios.get(`api/users/${theFriend.id}`, {withCredentials:true})
                                setSelectUser(result.data.user);
                                setResponsive(true);
                            }}>
                            <img className="rounded-full w-9 h-9" src={theFriend.avatarUrl} onError={AvatarErrorLoad}></img>
                            <span className={`status ${status(theFriend.isOnline)}`}></span>
                            <span className="truncate">{theFriend.username}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* /////////////////////////profile(moi ou user) + notif/////////////////////////////////////// */}
            <div className={`box_profile ${responsive ? 'flex flex-1' : 'hidden md:flex md:flex-1'}`}>
                {responsive && (
                    <button className="responsive_backBtn" onClick={() => setResponsive(false)}><IoIosArrowBack/></button>
                )}
                {isShowNotif === 1 ? (
                    <div className="show_notif">
                        <div className="">
                            <div className="title_notif">{t('profile.newMessage')}</div>
                            <div className="p-3">
                                {notifMsgUnread.map((senderId) => {
                                    const sender = lstFriends.find(f => f.id === senderId);
                                    return (
                                        <div className="items" key={senderId}
                                            onClick = {() => navigate('/chat', { state : {friendId: senderId} })}>
                                            <img className="avatar_notif" src={sender?.avatarUrl} onError={AvatarErrorLoad}></img>
                                            <span className="username_notif">{sender?.username}</span>
                                        </div>
                                    );
                                })}
                            </div>

                        </div>
                        <div>

                            <div className="title_notif">{t('profile.friendRequest')}</div>
                            <div className="p-3">
                                {lstFriendship.map((theRequest) => (
                                    <div className="items" key={theRequest.id}>
                                        <img className="avatar_notif" src={theRequest.avatarUrl} onError={AvatarErrorLoad}></img>
                                        <span className="username_notif">{theRequest.username}</span>
                                        <div className="box_icon">
                                            <button onClick = {() => AcceptRequest(theRequest.id)}><CiCircleCheck className="icon_notif"/></button>
                                            <button onClick = {() => DenieRequest(theRequest.id)}><CiCircleRemove className="icon_notif"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                       
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
                        {MyMatches.map(match => (
                            <div className="flex border-t border-gray-700 py-5">
                                <div className="w-1/3 truncate">{match.opponent}</div>
                                <div className="w-1/3">{match.result}</div>
                                <div className="w-1/3">{match.scoreLoser} / {match.scoreWinner}</div>
                                <div className="w-1/3">{match.durationSec}</div>
                                <div className="w-1/3">{new Date(match.endedAt).toLocaleDateString('fr-FR')}</div>
                            </div>
                        ))}
                    </div>
                    </>
                )}
            </div>
            
        </div>
    )
}
