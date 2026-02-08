import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { FieldValues } from 'react-hook-form'
import { CiMail, CiLock } from "react-icons/ci"; // mail && lock icon
import { LuEye,LuEyeClosed } from "react-icons/lu"; //eyes icon
import { Si42 } from "react-icons/si"; //42 icon
import { FaGithub } from "react-icons/fa"; // github icon
import { FcGoogle } from "react-icons/fc"; //google icon
import logo from '../assets/logo.png'
import { zodResolver } from '@hookform/resolvers/zod';
import { type T_connexionForm, connexionForm } from "../lib/types";
import "./style/login.css"

const Login = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false); //creates getter/setter and sets to them to bool false
  const passwordVisibility = () => setShowPassword(!showPassword); //ft to set showPassword to true or false

  const {
    register,
    handleSubmit,
    formState : { errors, isSubmitting }
  } = useForm<T_connexionForm>({
    resolver: zodResolver(connexionForm),
  });

  const navigate = useNavigate();

  const onSubmit = async (data: FieldValues) => {
    console.log("Form data :", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    navigate("/");
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}
      className="w-full h-screen flex items-center justify-center">
      <div className="form-box">

        <img src={logo} alt="Logo" className="w-50 md:70" />
        <h1 className="text-lg md:text-xl font-semibold">Connecte-toi pour jouer</h1>

        <p className="text-xs md:text-sm text-gray-500 text-center">Pas de compte ?
        <NavLink className="btn-txt" to="/Register">S'inscrire</NavLink>
        </p>

        <div className="w-full flex flex-col gap-3">
          <div className="icon-field">
            <CiMail />
            <input {...(register("email"))}
            type="email"
            placeholder="Adresse mail"
            className="input-field w-full"/>
          </div>
          {errors.email && <p className="text-left text-red-500 text-xs">{`${errors.email.message}`}</p>}

          <div className="icon-field">
            <CiLock />
            <input {...register("password")} 
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            className="input-field w-5/6"/>
            
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

        <button disabled={isSubmitting} type="submit" className="btn-sign">Connexion</button>

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
  );
}

export default Login