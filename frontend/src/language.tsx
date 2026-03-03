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
                'navbar.scoreboard' : 'Tableau des scores',
                'navbar.chat' : 'Messagerie',
                'navbar.profile' : 'Profile',
                'navbar.register' : 'Connexion',

                //HomePage
                'homepage.home' : 'Bienvenue sur notre transcendence'

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
                'navbar.register' : 'Register',

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
                'navbar.register' : 'Registarse',

                //HomePage
                'homepage.home' : 'Bienvenido a nuestra transcendence'
            }
        }
    }
});

export default i18n ;