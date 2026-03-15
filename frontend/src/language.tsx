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
                'homepage.home' : 'Bienvenue sur notre transcendence',

                //messagerie
                
                //profile
                'profile.modifier' : 'Modifier',
                'profile.deconnecion' : 'Deconnexion',
                'profile.datecreate' : 'Date de creation',
                'profile.actuelmdp' : 'Mot de pass actuel',
                'profile.newmdp' : 'Nouveau mot de passe',
                'profile.save' : 'Sauvegarder',
                'profile.annule' : 'Annuler',
                'profile.delete' : 'Supprimer l ami',
                'profile.add' : 'Ajouter en ami',
                'profile.pending' : 'Demande en attente',
                'profile.notification' : 'Notifications',
                'profile.newMessage' : 'Nouveaux messages',
                'profile.friendRequest' : 'Demande d amis',
                'profile.search' : 'Recherche',


                'profile.opponent' : 'Adversaire',
                'profile.result' : 'Resultat',
                'profile.score' : 'Score',
                'profile.time' : 'Duree',
                'profile.date' : 'Date',
            
                'profile.err.data' : 'Nom d utilisateur ou email déjà utilise',
                'profile.err.wrongPassword' : 'Le mot de passe ne correspond pas au mot de passe actuel',
                'profile.err.avatar' : 'Erreur lors du chargement de l image',
                'profile.err.usernameMin' : 'Ne peux contenir moins de 3 caracteres',
                'profile.err.Max' : 'Ne peux contenir plus de 24 caracteres',
                'profile.err.regex' : 'Caracteres autorises: lettres, chiffres, - et _',
                'profile.err.email' : 'Email valide requis',
                'profile.err.passMin' : 'Ne peux contenir moins de 10 caracteres',
                'profile.err.PasswordRegex' : 'Doit contenir minuscule, majuscule, chiffre et caractere special',
                'profile.err.ForbidenRegex' : '  .regex(ForbidenRegex, "Caracteres speciaux autorises: !@#$%&*()_-+=")',

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
                'homepage.home' : 'Welcome to our transcendence',

                //profile
                'profile.modifier' : 'Update',
                'profile.deconnecion' : 'logout',
                'profile.actuelmdp' : 'Current password',
                'profile.newmdp' : 'New password',
                'profile.save' : 'Save',
                'profile.annule' : 'Cancel',
                'profile.delete' : 'Delete friend',
                'profile.add' : 'Add to Friend',
                'profile.pending' : 'Pending request',

                'profile.opponent' : 'Opponent',
                'profile.result' : 'Result',
                'profile.score' : 'Score',
                'profile.time' : 'Time',
                'profile.date' : 'Date',
            
                'profile.err.data' : 'Nom d utilisateur ou email déjà utilise',
                'profile.err.avatar' : 'Erreur lors du chargement de l image',

                'profile.err.usernameMin' : 'Cannot be less than 3 characters',
                'profile.err.Max' : 'Ne peux contenir plus de 24 caracteres',
                'profile.err.regex' : 'Caracteres autorises: lettres, chiffres, - et _',
                'profile.err.email' : 'Email valide requis',
                'profile.err.passMin' : 'Ne peux contenir moins de 10 caracteres',
                'profile.err.PasswordRegex' : 'Doit contenir minuscule, majuscule, chiffre et caractere special',
                'profile.err.ForbidenRegex' : '  .regex(ForbidenRegex, "Caracteres speciaux autorises: !@#$%&*()_-+=")',
                
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
                'homepage.home' : 'Bienvenido a nuestra transcendence',

                //profile
                'profile.modifier' : 'Modificar',
                'profile.deconnecion' : 'Desconexión',
                'profile.datecreate' : 'Date de creation',
                'profile.actuelmdp' : 'Contraseña actual',
                'profile.newmdp' : 'Nueva contraseña',
                'profile.save' : 'Guardar',
                'profile.annule' : 'Cancelar',
                'profile.delete' : 'Eliminar el amigo',
                'profile.add' : 'Agregar como amigo',
                'profile.pending' : 'Solicitud pendiente',


                'profile.opponent' : 'Oponente',
                'profile.result' : 'Resultado',
                'profile.score' : 'Puntuaciones',
                'profile.time' : 'Duración',
                'profile.date' : 'Fecha',
            
                'profile.err.data' : 'Nombre de usuario o correo electrónico ya en uso',
                'profile.err.avatar' : 'Error al cargen la imagen',
                'profile.err.usernameMin' : 'No puede contener menos de 3 caracteres',
                'profile.err.Max' : 'No puede contener más de 24 caracteres',
                'profile.err.regex' : 'Caracteres permitidos: letras, números, - y _',
                'profile.err.email' : 'Se requiere un correo electrónico válido',
                'profile.err.passMin' : 'No puede contener menos de 10 caracteres',
                'profile.err.PasswordRegex' : 'Debe contener una minúscula, una mayúscula, un número y un cáracter especial',
                'profile.err.ForbidenRegex' : 'Caracteres especiales permitidos: !@#$%&*()_-+="',
            }
        }
    }
});

export default i18n ;