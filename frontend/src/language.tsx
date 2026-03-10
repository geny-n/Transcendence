import i18n from "i18next";
import { initReactI18next} from "react-i18next";

i18n.use(initReactI18next).init({
    debug:true,
    fallbackLng:'fr',
    resources:{
        fr: {
            translation: {
                //navbar
                'navbar.home' : 'Accueil',
                'navbar.pong' : 'PingPong',
                'navbar.scoreboard' : 'Scores',
                'navbar.chat' : 'Messagerie',
                'navbar.profile' : 'Profile',
                'navbar.login' : 'Connexion',

                //HomePage
                'homepage.home' : 'Bienvenue sur notre transcendence'

                //messagerie
                

            }
        },
        en: {
            translation: {
                //navbar
                'navbar.home' : 'Home',
                'navbar.pong' : 'PingPong',
                'navbar.scoreboard' : 'Scoreboard',
                'navbar.chat' : 'Chat',
                'navbar.profile' : 'Profile',
                'navbar.login' : 'Login',

                //HomePage
                'homepage.home' : 'Welcome to our transcendence'
            }
        },
        es : {
            translation: {
                //navbar
                'navbar.home' : 'Inicio',
                'navbar.pong' : 'PingPong',
                'navbar.scoreboard' : 'Tabla de puntuaciones',
                'navbar.chat' : 'Chat',
                'navbar.profile' : 'Perfil',
                'navbar.login' : 'Registarse',

                //HomePage
                'homepage.home' : 'Bienvenido a nuestra transcendence'
            }
        }
    }
});

export default i18n ;