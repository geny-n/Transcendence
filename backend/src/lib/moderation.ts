// import { InferenceClient  } from "@huggingface/inference";
//import * as dotenv from 'dotenv';

// export async function toxicityScale(msg:string) {


//    dotenv.config({ path: '../.env' });

//     const inference = new InferenceClient(process.env.HUGGING_TOKEN);
//     const output = await inference.textClassification({
//         model: "unitary/multilingual-toxic-xlm-roberta",
//         provider: "hf-inference",
//         inputs : msg,
//     });

//     console.log(msg, " : ", output);
// }
// toxicityScale("salut");

// export async function toxicityScale(msg:string): Promise<{flag:boolean}>{
// 	try {
// 		const response = await fetch
// 		(
// 			"https://router.huggingface.co/hf-inference/models/unitary/multilingual-toxic-xlm-roberta",
// 			{
// 				headers :{
// 					Authorization:`Bearer ${process.env.HUGGING_TOKEN}`,
// 					"content-type": "application/json",
// 				},
// 				method: "POST",
// 				body: JSON.stringify({inputs: msg}),
// 			}
// 		);
// 		const result = await response.json();
// 		const score = result[0][0]?.score ?? 0;
// 		console.log("score = ", score);
// 		const flag = score > 0.8;
// 		return {flag};
// 	}
// 	catch {
// 		return {flag : false};
// 	}
// }

// toxicityScale("salope a toi").then(console.log);