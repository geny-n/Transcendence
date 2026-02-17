import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import type { FieldValues } from 'react-hook-form';
import { CgProfile } from "react-icons/cg";
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye,LuEyeClosed } from "react-icons/lu"; //eyes icon
import { Si42 } from "react-icons/si"; //42 icon
import { FaGithub } from "react-icons/fa"; // github icon
import { FcGoogle } from "react-icons/fc"; //google icon
import logo from '../assets/logo.png';
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_inscriptionForm, inscriptionForm } from '../lib/types';
import axios  from '../api/axios';
import "./style/login.css";

const Register = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const passwordVisibility = () => setShowPassword(!showPassword);

  const [showConfirmPass, setShowConfirmPass] = useState<boolean>(false);
  const ConfirmPassVisibility = () => setShowConfirmPass(!showConfirmPass);

  const navigate = useNavigate();
  const register_url = '/api/register';
  // const register_url = 'http://localhost:3100/register';

  const {
    register,
    handleSubmit,
    formState : { errors, isSubmitting }
  } = useForm<T_inscriptionForm>({
    resolver: zodResolver(inscriptionForm),
  });

  const onSubmit = async (data: FieldValues) => {
    console.log("Form data2 :", data);
    const username = data.username;
    const email = data.email;
    const password = data.password;
    try{
      // const response = await axios.post(register_url,
      //   JSON.stringify({username, email, password}),
      //   {
      //     headers: { 'Content-Type': 'application/json'},
      //     withCredentials : true
      //   });
      const response = await axios.post(
        register_url,
        { username, email, password },
        { withCredentials: true }
      );
        console.log(response.data);
        // console.log(response.accessToken)
        console.log(JSON.stringify(response))
        //setSuccess(true));
        navigate("/login")
    }catch(err){
      console.log("erreur connexion", err);
      }
  }
  
  return (
      <form onSubmit={handleSubmit(onSubmit)}
      className="w-full h-screen flex items-center justify-center">
      <div className="form-box">

        <img src={logo} alt="logo" className="w-50 md:70" />
        <h1 className="text-lg md:text-xl font-semibold">Inscris-toi pour Jouer</h1>

        <p className="text-lg md:text-sm text-gray-500 text-center">Déjà un compte ?
        <NavLink className="btn-txt" to="/login">Se connecter</NavLink>
        </p>

        <div className="w-full flex flex-col gap-3">

          <div className="icon-field">
            <CgProfile />
            <input {...(register("username"))} 
            type="text"
            placeholder="Nom d'utilisateur"
            className="input-field w-full" />
          </div>
          {errors.username && <p className="text-left text-red-500 text-xs">{`${errors.username.message}`}</p>}

          <div className="icon-field">
            <CiMail />
            <input {...(register("email"))} 
            type="email"
            placeholder="Adresse mail"
            className="input-field w-full" />
          </div>
          {errors.email && <p className="text-left text-red-500 text-xs">{`${errors.email.message}`}</p>}

          <div className="icon-field">
            <CiLock />
            <input {...(register("password"))}
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            className="input-field w-5/6" />

            {showPassword ? (
              <LuEye className="absolute right-5 cursor-pointer"
              onClick={passwordVisibility} />
            ) : (
              <LuEyeClosed className="absolute right-5 cursor-pointer"
              onClick={passwordVisibility} />
            )}
          </div>
          {errors.password && <p className="text-left text-red-500 text-xs">{`${errors.password.message}`}</p>}

          <div className="icon-field">
            <CiLock />
            <input {...(register("confirmPass"))}
            type={showConfirmPass ? "text" : "password"}
            placeholder="Confirmer le mot de passe"
            className="input-field w-5/6" />

            {showConfirmPass ? (
              <LuEye className="absolute right-5 cursor-pointer"
              onClick={ConfirmPassVisibility} />
            ) : (
              <LuEyeClosed className="absolute right-5 cursor-pointer"
              onClick={ConfirmPassVisibility} />
            )}
          </div>
          {errors.confirmPass && <p className="text-left text-red-500 text-xs">{`${errors.confirmPass.message}`}</p>}
        </div>

        <button disabled={isSubmitting} type="submit" className="btn-sign">S'inscrire</button>

        <div className="relative w-full flex items-center justify-between py-3">
          <div className="icon-btn">
            <FaGithub className="text-lg md:text-xl"/>
          </div>
          <div className="icon-btn">
            <Si42 className="text-lg md:text-xl"/>
          </div>
          <div className="icon-btn">
            <FcGoogle className="text-lg md:text-xl"/>
          </div>
          </div>
      </div>
    </form>
  )
}

export default Register