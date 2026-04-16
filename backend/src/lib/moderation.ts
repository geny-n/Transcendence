// import { InferenceClient  } from "@huggingface/inference";

import * as dotenv from 'dotenv';

dotenv.config({path: '../.env'});


type Res = {label: string; score: number}[][];
export async function toxicityScale(msg:string): Promise<{flag:boolean}>{
	try {
		const response = await fetch
		(
			"https://router.huggingface.co/hf-inference/models/unitary/multilingual-toxic-xlm-roberta",
			{
				headers :{
					Authorization:`Bearer ${process.env.HUGGING_TOKEN}`,
					"content-type": "application/json",
				},
				method: "POST",
				body: JSON.stringify({inputs: msg}),
			}
		);
		if (!response.ok)
			throw new Error(`HuggingFace error ${response.status}`);
		const result = await response.json() as Res;
		const score = result[0]?.find(s => s.label === 'toxic')?.score ?? 0;
		const flag = score >= 0.5;
		return {flag};
	}
	catch {
		return {flag : false};
	}
}
//toxicityScale("I want to kill you").then(console.log);