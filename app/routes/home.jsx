export async function clientLoader({}) {
  const res = await fetch(`/api/fetch-sources`);
  const product = await res.json();
  return product;
}

// HydrateFallback is rendered while the client loader is running
export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Product({ loaderData }) {
  // const { name, description } = loaderData;
  return <div>VEDANT</div>;
}
