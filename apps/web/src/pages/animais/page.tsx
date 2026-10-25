import { useSearchParams } from "react-router";
import { AnimalList } from "@/features/animal/AnimalList";

export default function Page() {
  const [searchParams] = useSearchParams();
  // Filtros da URL (?busca=…&situacao=…); um parâmetro repetido vira lista.
  const query = Object.fromEntries(
    [...new Set(searchParams.keys())].map((key) => {
      const values = searchParams.getAll(key);
      return [key, values.length > 1 ? values : values[0]];
    }),
  );

  return (
    <div className="flex justify-center p-8">
      <AnimalList initialQuery={query} />
    </div>
  );
}
