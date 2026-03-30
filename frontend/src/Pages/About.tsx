import "./style/about.css";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { loadMarkdown } from '../hooks/markdown';

export default function About ()
{
	const { t } = useTranslation();
	const term_path = t('about.terms-txt');
	const privacy_path = t('about.privacy-txt');

	console.log("term path: ", term_path);
	console.log("privacy path: ", privacy_path);

	const term_content = loadMarkdown(term_path);
	const privacy_content = loadMarkdown(privacy_path);

  return (
	<div className="default-pos">
		<details className="detail-style">
			<summary className="summary-title">{t('about.privacy')}</summary>
				<div className="summary-txt">
					{<ReactMarkdown>{privacy_content}</ReactMarkdown>}
				</div>
		</details>

		<details className="detail-style">
			<summary className="summary-title">{t('about.terms')}</summary>
				<div className="summary-txt">
					{<ReactMarkdown>{term_content}</ReactMarkdown>}
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