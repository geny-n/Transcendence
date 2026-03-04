import { useTranslation } from 'react-i18next'

export default function HomePage ()
{
    const {t} = useTranslation();
    return (
        <div className='text-white text-3xl min-h-screen flex items-center justify-center'>
        {t('homepage.home')}
    </div>
    )
}