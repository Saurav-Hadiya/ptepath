interface Props {
  score: number;
  maxScore?: number;
}

export default function ScoreDisplay({ score, maxScore = 90 }: Props) {
  return (
    <span>
      {score} / {maxScore}
    </span>
  );
}
