import ProblemContent from '@/components/contents/ProblemContent';
import type { GetDataFilter } from '@/types/output';

type AppProblemProps = {
  filter?: GetDataFilter;
};

export default function AppProblem({ filter }: AppProblemProps) {
  return (
    <section>
      <ProblemContent filter={filter} />
    </section>
  );
}
