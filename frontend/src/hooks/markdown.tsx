import { useEffect, useState } from 'react';

export function loadMarkdown(path: string) {
	const [content, setContent] = useState("");

	useEffect(() => {
		fetch(path)
		.then((res) => res.text())
		.then(setContent);
	}, [path]);
	return content;
}

// function useMarkdown(path) {
//   const [content, setContent] = useState("");
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     if (!path) return;

//     setLoading(true);

//     fetch(path)
//       .then((res) => res.text())
//       .then((text) => {
//         setContent(text);
//         setLoading(false);
//       })
//       .catch(() => {
//         setContent("Erreur de chargement");
//         setLoading(false);
//       });
//   }, [path]);

//   return { content, loading };
// }

// const { content, loading } = useMarkdown(path);

// if (loading) return <p>Loading...</p>;