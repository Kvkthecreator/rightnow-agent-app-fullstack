export const useCreateBasket = () => {
  const mutate = async (
    name: string,
    slug: "brand_playbook" | "blank",
  ): Promise<string> => {
    const res = await fetch("/api/baskets/new", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ basket_name: name, template_slug: slug }),
    });
    if (!res.ok) {
      throw new Error("create fail");
    }
    const json = await res.json();
    return json.basket_id as string;
  };
  return { mutate };
};
