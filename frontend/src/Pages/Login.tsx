import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye,LuEyeClosed } from "react-icons/lu"; //eyes icon
import { Si42 } from "react-icons/si"; //42 icon
import { FaDiscord } from "react-icons/fa"; // github icon
import logo from '../assets/logo.png';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_connexionForm, connexionForm } from '../lib/types';
import axios from "axios";
import "./style/login.css";
import { useAuth } from '../main';
import { useTranslation } from 'react-i18next';

const Login = () => {
	const { setUser, setAccessToken } = useAuth();
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const passwordVisibility = () => setShowPassword(!showPassword);

	const [errMsg, setErrMsg] = useState<string>('')

	const navigate = useNavigate();
	const login_url = '/api/login';
	const fortyAuth_url = 'api/auth/42';
	const discordAuth_url = 'api/auth/discord';

	const { t } = useTranslation();

	const { user } = useAuth();

	useEffect (() => {
        if (!user) return;
        if (user){
            navigate('/', { replace: true });
            return
        }
    }, [user]);

	const {
		register,
		handleSubmit,
		formState : { errors, isSubmitting }
	} = useForm<T_connexionForm>({
		resolver: zodResolver(connexionForm(t)),
	});

	const fortyAuth = () => {
		window.location.href = fortyAuth_url;
		// navigate("/matchmaking");
    }

	const discordAuth = () => {
		window.location.href = discordAuth_url;
		// navigate("/matchmaking");
	}

	const onSubmit = async (data: FieldValues) => {
		const email = data.email;
		const password = data.password;
		try{
			const response = await axios.post(
				login_url,
				{ email, password },
				{ withCredentials: true }
			);
			console.log(response.data);
			console.log(response.data.status);
			// Store the access token for Socket.io
			if (response.data.accessToken) {
				setAccessToken(response.data.accessToken);
				console.log("[Login] Stored accessToken in context");
			}
			const me = await axios.get('/api/users/me', { withCredentials: true });
			setUser(me.data.user);
			setErrMsg("");
			
			// Check for unfinished games and auto-join if exists
			// The Socket.io connection will handle checking for incomplete games
			// by emitting a query to the backend after connection
			navigate("/matchmaking");
		}catch(err){
			if (axios.isAxiosError(err))
			{
				if (err.response)
				{
					console.log("Backend error: ", err.response.data);
					console.log("Status: ", err.response.status);
					if (err.response.status == 401)
						setErrMsg(t('login.err-input'));
					else
						setErrMsg(t('login.err-server'));
				}
			}
		}
	}

	useEffect(() => {
		if (sessionStorage.getItem('User deleted'))
		{
			sessionStorage.removeItem('User deleted');
			setErrMsg(t('login.delete.user'));
		}
	}, []);

	return (
		<form onSubmit={handleSubmit(onSubmit)}
			className="min-h-screen flex flex-col items-center justify-start pt-32 px-4">
			<div className="form-box">

				<img src={logo} alt="Logo" className="w-50 md:70" />
				<h1 className="text-lg md:text-xl font-semibold">{t('login.to-play')}</h1>

				<p className="text-xs md:text-sm text-gray-500 text-center">{t('login.accountless')}
				<NavLink className="btn-txt" to="/Register">{t('login.register')}</NavLink>
				</p>

				<div className="w-full flex flex-col gap-3">
					<div className="icon-field">
						<CiMail />
						<input {...(register("email"))}
						type="email"
						placeholder={t('login.email')}
						className="input-field w-full"
						autoComplete='email'/>
					</div>
					{errors.email && <p className="text-left text-red-500 text-xs"> {`${errors.email.message}`}</p>}

					<div className="icon-field">
						<CiLock />
						<input {...register("password")}
						type={showPassword ? "text" : "password"}
						placeholder={t('login.pwd')}
						className="input-field w-5/6"
						autoComplete='current-password'/>

						{showPassword ? (
							<LuEye className="absolute inset-e-5 cursor-pointer"
							onClick={passwordVisibility}/>
						) : (
							<LuEyeClosed className="absolute inset-e-5 cursor-pointer"
							onClick={passwordVisibility}/>
						)}
					</div>
					{errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>}
				</div>

				{errMsg && <p className="text-center text-red-500 text-xs"> {`${errMsg}`} </p>}

				<button disabled={isSubmitting} type="submit" className="btn-sign">{t('login.connexion')}</button>

				<div className="icon-btn-overall" >
					<div className="icon-btn" onClick={discordAuth}>
						<FaDiscord className="text-lg md:text-xl" />
					</div>
					<div className="icon-btn" onClick={fortyAuth}>
						<Si42 className="text-lg md:text-xl" />
					</div>
				</div>
			</div>
		</form>
	);
}

export default Login
