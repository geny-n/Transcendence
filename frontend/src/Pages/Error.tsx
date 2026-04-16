import { useTranslation } from 'react-i18next';

export default function Error() 
{
    const { t } = useTranslation();
    return (
        <div>
            {/* {message} */}
            <button>{t('error.back')}</button>
        </div>
    );
}