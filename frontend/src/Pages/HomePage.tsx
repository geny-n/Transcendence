import { useTranslation } from 'react-i18next'
import logo from '../assets/logo.png';

export default function HomePage ()
{
    const {t} = useTranslation();
    return (
        <div>

            <img src={logo} alt="logo" className="block mx-auto mt-24 w-128" />
            <div className='text-white text-3xl items-center justify-center'>
                {t('homepage.home')}
            </div>

        </div>
    )
}