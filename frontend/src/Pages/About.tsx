import { useState, useEffect } from "react";
import "./style/about.css";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { markdownComponents } from "../lib/mdComponent";

export default function About ()
{
	const {t} = useTranslation();
	const [privacyContent, setPrivacyContent] = useState("");
	const [termsContent, setTermsContent] = useState("");

	useEffect(() => {
		fetch(t("about.privacy-txt")).then(res =>res.text()).then(setPrivacyContent);
		fetch(t("about.terms-txt")).then(res => res.text()).then(setTermsContent);
	}, [t])

  return (
	<div className="default-pos">
		<details className="detail-style">
			<summary className="summary-title">{t('about.privacy')}</summary>
				<div className="summary-txt">
				<ReactMarkdown components={markdownComponents}>{privacyContent}</ReactMarkdown>
				</div>
		</details>

		<details className="detail-style">
			<summary className="summary-title">{t('about.terms')}</summary>
				<div className="summary-txt">
					<ReactMarkdown components={markdownComponents}>{termsContent}</ReactMarkdown>
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