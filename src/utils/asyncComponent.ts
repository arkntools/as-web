import type { AsyncComponentLoader, AsyncComponentOptions } from 'vue';

export const defineAsyncComponentWithName = <T extends Component = { new (): ComponentPublicInstance }>(
  name: string,
  source: AsyncComponentLoader<T> | AsyncComponentOptions<T>,
) => {
  const component = defineAsyncComponent(source);
  // @ts-expect-error
  component.name = name;
  return component;
};
