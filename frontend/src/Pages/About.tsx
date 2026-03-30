import "./style/about.css";
import { useTranslation } from "react-i18next";

export default function About ()
{
	const {t} = useTranslation();
  return (
	<div className="default-pos">
		<details className="detail-style">
			<summary className="summary-title">{t('about.privacy')}</summary>
				<div className="summary-txt">
					{t('about.privacy-txt')}
				</div>
		</details>

		<details className="detail-style">
			<summary className="summary-title">{t('about.terms')}</summary>
				<div className="summary-txt">
					{t('about.terms-txt')}
				</div>
		</details>

		<details className="detail-style">
			<summary className="summary-title">{t('about.faq')}</summary>
				<div className="summary-txt">
					{t('about.faq-txt')}
				</div>
		</details>
	</div>
  )
}