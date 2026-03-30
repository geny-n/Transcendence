import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye,LuEyeClosed } from "react-icons/lu"; //eyes icon
import { Si42 } from "react-icons/si"; //42 icon
import { FaGithub } from "react-icons/fa"; // github icon
import { FcGoogle } from "react-icons/fc"; //google icon
import logo from '../assets/logo.png';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_connexionForm, connexionForm } from '../lib/types';
import axios from "axios";
import "./style/login.css";
import { useAuth } from '../main';
import { useTranslation } from 'react-i18next';

const Login = () => {
	const { setUser } = useAuth();
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const passwordVisibility = () => setShowPassword(!showPassword);

	const [errMsg, setErrMsg] = useState<string>('');

	const { t } = useTranslation(); 

	const navigate = useNavigate();
	const login_url = '/api/login';
	const oAuth_url = '/api/auth/42';

	const {
		register,
		handleSubmit,
		formState : { errors, isSubmitting }
	} = useForm<T_connexionForm>({
		resolver: zodResolver(connexionForm),
	});

	const handle_oAuth42 = async () => {
		console.log("Connexion via 42");
		try{
			const response = await axios.get(oAuth_url);
			// const me = await axios.get('/api/userts/me', { withCredentials: true });
			console.log(response);
			setErrMsg("");
			navigate("/");
		}catch(err){
			if (axios.isAxiosError(err))
			{
				if(err.response)
					console.log("Error: oAuth-42: ", err.response);
			}
		}
	}

	const onSubmit = async (data: FieldValues) => {
		console.log("Connexion data: ", data);
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
			const me = await axios.get('/api/users/me', { withCredentials: true });
			setUser(me.data.user);
			setErrMsg("");
			navigate("/");
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
	return (
		<form onSubmit={handleSubmit(onSubmit)}
			className="w-full h-screen flex items-center justify-center">
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
							<LuEye className="absolute right-5 cursor-pointer"
							onClick={passwordVisibility}/>
						) : (
							<LuEyeClosed className="absolute right-5 cursor-pointer"
							onClick={passwordVisibility}/>
						)}
					</div>
					{errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>}
				</div>

				{errMsg && <p className="text-center text-red-500 text-xs"> {`${errMsg}`} </p>}

				<button disabled={isSubmitting} type="submit" className="btn-sign">{t('login.connexion')}</button>

				<div className="relative w-full flex items-center justify-between py-3">
					<div className="icon-btn">
						<FaGithub className="text-lg md:text-xl"/>
					</div>
					<button className="icon-btn" type="button" onClick={handle_oAuth42}>
						<Si42 className="text-lg md:text-xl"/>
					</button>
					<div className="icon-btn">
						<FcGoogle className="text-lg md:text-xl"/>
					</div>
				</div>
			</div>
		</form>
	);
}

export default Login
