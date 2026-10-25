import { lazy, Suspense, type ComponentType, type ReactNode } from "react";

/**
 * Carrega o componente sob demanda (código separado no build), mostrando `loading` enquanto
 * ele chega. Usado em telas pesadas, como os mapas do Leaflet:
 *
 *   lazyComponent(() => import("./Mapa").then((m) => m.Mapa), { loading: … })
 */
export function lazyComponent<P extends object>(
  load: () => Promise<ComponentType<P>>,
  { loading }: { loading?: () => ReactNode } = {},
) {
  const Component = lazy(() =>
    load().then((component) => ({ default: component })),
  );
  return function LazyComponent(props: P) {
    return (
      <Suspense fallback={loading?.() ?? null}>
        <Component {...props} />
      </Suspense>
    );
  };
}
