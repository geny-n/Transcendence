import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { CgProfile } from "react-icons/cg";
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye, LuEyeClosed } from "react-icons/lu"; //eyes icon
import { Si42 } from "react-icons/si"; //42 icon
import { FaDiscord } from "react-icons/fa"; // github icon
import logo from '../assets/logo.png';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_inscriptionForm, inscriptionForm } from '../lib/types';
import axios from "axios";
import "./style/login.css";
import { useTranslation } from 'react-i18next';

const Register = () => {
	const [showPassword, setShowPassword] = useState<boolean>(false);
	const passwordVisibility = () => setShowPassword(!showPassword);

	const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
	const ConfirmPassVisibility = () => setShowConfirmPass(!showConfirmPass);

	const [errMsg, setErrMsg] = useState<string>('');

	const navigate = useNavigate();
	const register_url = '/api/register';
	const fortyAuth_url = 'api/auth/42';
	// const dicordAuth_url = 'api/auth/discord';

	const { t } = useTranslation();

	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<T_inscriptionForm>({
		resolver: zodResolver(inscriptionForm(t)),
	});

	const fortyAuth = () => {
		window.location.href = fortyAuth_url;
    }

	// const discordAuth = () => {
	// 	window.location.href = discordAuth_url;
	// }

	const onSubmit = async (data: FieldValues) => {
		console.log("Inscription data :", data);
		const username = data.username;
		const email = data.email;
		const password = data.password;
		try {
			const response = await axios.post(
				register_url,
				{ username, email, password },
				{ withCredentials: true }
			);
			console.log(response.data);
			console.log(JSON.stringify(response));
			setErrMsg("");
			navigate("/login");
		} catch (err) {
			if (axios.isAxiosError(err)) {
				if (err.response) {
					console.log("Backend error: ", err.response.data);
					console.log("Status: ", err.response.status);
					if (err.response.status == 409)
						setErrMsg(t('register.err-used'))
				}
				else
					setErrMsg(t('register.err-server'));
			}
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)}
			className="w-full h-screen flex items-center justify-center">
			<div className="form-box">

				<img src={logo} alt="logo" className="w-50 md:70" />
				<h1 className="text-lg md:text-xl font-semibold">{t('register.to-play')}</h1>

				<p className="text-lg md:text-sm text-gray-500 text-center">{t('register.has-account')}
					<NavLink className="btn-txt" to="/login">{t('register.to-login')}</NavLink>
				</p>

				<div className="w-full flex flex-col gap-3">

					<div className="icon-field">
						<CgProfile />
						<input {...(register("username"))}
							type="text"
							placeholder={t('register.username')}
							className="input-field w-full" />
					</div>
					{errors.username && <p className="text-left text-red-500 text-xs">{`${errors.username.message}`}</p>}

					<div className="icon-field">
						<CiMail />
						<input {...(register("email"))}
							type="email"
							placeholder={t('register.mail')}
							className="input-field w-full" />
					</div>
					{errors.email && <p className="text-left text-red-500 text-xs">{`${errors.email.message}`}</p>}

					<div className="icon-field">
						<CiLock />
						<input {...(register("password"))}
							type={showPassword ? "text" : "password"}
							placeholder={t('register.pwd')}
							className="input-field w-5/6" />

						{showPassword ? (
							<LuEye className="absolute inset-e-5 cursor-pointer"
								onClick={passwordVisibility} />
						) : (
							<LuEyeClosed className="absolute inset-e-5 cursor-pointer"
								onClick={passwordVisibility} />
						)}
					</div>
					{errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>}

					<div className="icon-field">
						<CiLock />
						<input {...(register("confirmPass"))}
							type={showConfirmPass ? "text" : "password"}
							placeholder={t('register.confirm-pwd')}
							className="input-field w-5/6" />

						{showConfirmPass ? (
							<LuEye className="absolute inset-e-5 cursor-pointer"
								onClick={ConfirmPassVisibility} />
						) : (
							<LuEyeClosed className="absolute inset-e-5 cursor-pointer"
								onClick={ConfirmPassVisibility} />
						)}
					</div>
					{errors.confirmPass && <p className="text-left text-red-500 text-xs">{`${errors.confirmPass.message}`}</p>}
				</div>

				{errMsg && <p className="text-center text-red-500 text-xs"> {errMsg} </p>}

				<button disabled={isSubmitting} type="submit" className="btn-sign">{t('register.to-register')}</button>

				<div className="icon-btn-overall" /*onClick={discordAuth}*/ >
					<div className="icon-btn">
						<FaDiscord className="text-lg md:text-xl" />
					</div>
					<div className="icon-btn" onClick={fortyAuth}>
						<Si42 className="text-lg md:text-xl" />
					</div>
				</div>
			</div>
		</form>
	)
}

export default Register