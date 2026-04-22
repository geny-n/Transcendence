import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './style/Chat.css'
import axios from "axios";
import { TheSocket } from "../socket"
import { useLocation } from 'react-router-dom';
import useUser from '../lib/user';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../main';

export default function Chat ()
{
	const {t} = useTranslation();
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();

	const Myself = useUser (state => state.userMyself);
	const fetchMe = useUser (state => state.fetchMe);

	const lstFriends = useUser (state => state.userFriends);
	const initSocket = useUser (state => state.initsocket);

	const [selectFriendId, setSelectFriendId] = useState<string | null>(null);
	const selectFriend = lstFriends.find(f => f.id === selectFriendId) ?? null;

	const { socket } = TheSocket();

	const [NewMsg, setNewMsg] = useState('');
	const [prevMsg, setPrevMsg] = useState<{id: string, msg: string, time: string, senderId: string}[]>([]);
	//permet de garder en memoire touts les messages (le 1er message n es pas ecraser par le 2eme)
	const [errMsg, setErrMsg] = useState('');
	const scrollAuto = useRef<HTMLDivElement>(null);

	useEffect(() => {//recuperer mes informations
			 if (!user)
				navigate('/login');
			else if (!Myself)
					fetchMe();
		}, [user]);

	useEffect (() => {
		if (!socket)
				return;
		initSocket(socket);
	}, [socket]);


	const status = (isOnline: boolean) => {
		if (isOnline)
				return "bg-emerald-500";
		return "bg-gray-300";
	}

	//en cours de discution
	useEffect(() => {
		if (!socket || !selectFriend)
				return;
		const handler = (incoming: {
			id: string;
			user:string;
			text: string;
			time: string;
			senderId: string;
		}) => {
			if (incoming.senderId !== selectFriend.id && incoming.senderId !== Myself?.id)
					return;
			setPrevMsg(prev => [...prev, {
				id: incoming.id ?? '',
				msg: incoming.text,
				time: incoming.time,
				senderId: incoming.senderId
			}]);
			if (incoming.senderId === selectFriend.id)
				axios.patch(`/api/users/chat/${selectFriend.id}/read`, {}, {withCredentials:true});
		}
		socket.on("privMessage", handler);
		return () => {
			socket.off("privMessage", handler);
		};
	},[socket, selectFriend]);

	//pour selectionner uniquement les messages concernant l ami selectionne
	useEffect(() => {
		setPrevMsg([]);
		if (!Myself || !selectFriend)
			return;
		axios.patch(`/api/users/chat/${selectFriend.id}/read`, {}, {withCredentials:true});
		axios.get(`/api/users/chat/${selectFriend.id}`, {withCredentials:true})
			.then(res => {
				const loaded = res.data.messages.map((m:any) =>({
					id: m.id,
					msg:m.message,
					time: new Date(m.time).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' }),

					// Si senderId = mon id → c'est moi qui ai envoyé → affiche mon username
					// Sinon → c'est mon ami qui a envoyé → affiche son username
					senderId: m.senderId
				}));
				setPrevMsg(loaded);
			})
	}, [selectFriend, Myself]);

	const sendMsg = () => {
		if (!NewMsg.trim() || !Myself || !selectFriend || !socket) //verifier les messages vides ou espace avant et fin du message
			return;
		if (NewMsg.length > 500) {
			setErrMsg(t('chat.longMsg'));
			return;
		}
		const theTime = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });
		socket.emit("privMessage", {
			user: Myself.username,
			text: NewMsg,
			time: theTime,
			receivedId: selectFriend.id,
		});
		setNewMsg('');
		setErrMsg('');
	}


	//moderation
	useEffect (() => {
		if (!socket)
			return ;
		//faire des trucs quand socket.emit appel handlerSender
		const handlerSender = (data: { id: string }) => {
			setPrevMsg(prev => prev.filter(m => m.id !== data.id));
			alert(t('chat.moderation'));
		};
		socket.on('MessageBlocked', handlerSender);
		return() => {
			socket.off('MessageBlocked', handlerSender);
		};

	}, [socket, t]);

	useEffect (() => {
		scrollAuto.current?.scrollIntoView({ behavior: 'auto'});
	}, [prevMsg, errMsg]);

	useEffect (() => {
		if (!location.state?.friendId || lstFriends.length === 0)
				return;
		const friend = lstFriends.find(f => f.id === location.state.friendId);
		if (friend)
			setSelectFriendId(friend.id);
	}, [location.state, lstFriends]);

	return (
		<div className="all_chat_screen">
			<div className="top">
				{/* ***************************************************************** */}
				<div className="myPP">
					{Myself && (
						<>
						<img className="rounded-full w-9 h-9" src={Myself.avatarUrl}></img>
						<p>{Myself.username}</p>
						</>
					)}
				</div>

				{/* ***************************************************************** */}

				<div className="box_friend">
					{selectFriend && (
						<>
						<div className="relative">
							<div className="w-13 pl-1">
								<img className="rounded-full w-9 h-9" src={selectFriend.avatarUrl}></img>
								<span className={`friend_status ${status(selectFriend.isOnline)}`}></span>
							</div>
						</div>
						<div className="truncate">{selectFriend.username}</div>
						</>)}
				</div>
			</div>

			{/* ***************************************************************** */}

			<div className="bottom">
				<div className="box_list">
					{lstFriends.map((theFriend, idx) => {
						let isSelected;
						if (selectFriend?.id === theFriend.id)
								isSelected = 'bg-gray-300';
						return (
							<div className={`display_lst ${isSelected}`}
								key={idx} onClick={() => {
									setSelectFriendId(theFriend.id);
									//change le status read en true quand le user click sur le sender
									axios.patch(`/api/users/chat/${theFriend.id}/read`, {}, {withCredentials:true});
								}}
							>
								<img className="rounded-full w-10 h-10" src={theFriend.avatarUrl}></img>
								<span className={`display_status ${status(theFriend.isOnline)}`}></span>
								<div className="truncate">{theFriend.username}</div>
							</div>
						);
					})}
				</div>

				{/* ***************************************************************** */}

				<div className="w-2/3 flex flex-col ">
					<div className="box_message">
						{/* permet de mapper chaque message envoyer en leur donnant un index pour les affichiers dans l ordre d envoie */}
						{prevMsg.map((theMsg, idx) => {
							const isMe = theMsg.senderId === Myself?.id;
							const senderName = isMe ? Myself?.username : selectFriend?.username;
							const senderAvatar = isMe ? Myself?.avatarUrl : selectFriend?.avatarUrl;
							return (
								<div className="display_Msg" key={idx}>
									<div className="flex gap-3">
										<img className="rounded-full w-12 h-12" src={senderAvatar}></img>
										<span className="text-sm font-semibold">{senderName}</span>
										<span className="text-sm text-body">{theMsg.time}</span>
									</div>
									<span className="flex items-left pt-1 text-left whitespace-pre-wrap">{theMsg.msg}</span>
								</div>
							)
						})}
						{errMsg && <p className='err'>{errMsg}</p>}
						<div ref={scrollAuto}></div>
					</div>

					{/* ***************************************************************** */}

					<div className="box_send">
							<textarea
								value={NewMsg}
								onChange={e => {setNewMsg(e.target.value); setErrMsg('');}}
								placeholder={t('chat.yourMsg')}
								className="send_msg"
								style={{
									resize: 'none',
								}}
								onKeyDown={e => {
									if (e.key === 'Enter' && !e.shiftKey) {
										e.preventDefault();
										sendMsg();
									}
								}}
							/>
						<button className="send_but" onClick={sendMsg}>
							{t('chat.send')}
						</button>
					</div>
				</div>
			</div>
		</div>
	)

}
