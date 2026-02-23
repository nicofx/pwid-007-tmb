import Link from 'next/link';

export default function Home(): React.ReactElement {
  return (
    <main className="container">
      <h1>Take Me Back - Dev</h1>
      <p>Baseline stack running.</p>
      <p>
        Go to <Link href="/play">/play</Link> for the game runtime UI.
      </p>
    </main>
  );
}
