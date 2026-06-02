import { useState } from "react";

type DesignerBirdLabPageProps = {
  nickname: string;
};

type BirdPrototype = {
  id: string;
  name: string;
  trait: string;
  power: number;
  speed: number;
};

const baseBirds: BirdPrototype[] = [
  {
    id: "bird-1",
    name: "岩羽",
    trait: "冲击后额外造成结构裂纹",
    power: 8,
    speed: 4,
  },
  {
    id: "bird-2",
    name: "风切",
    trait: "飞行速度高，适合远距打点",
    power: 5,
    speed: 9,
  },
];

export const DesignerBirdLabPage = ({ nickname }: DesignerBirdLabPageProps) => {
  const [birds, setBirds] = useState<BirdPrototype[]>(baseBirds);
  const [name, setName] = useState("");
  const [trait, setTrait] = useState("");
  const [power, setPower] = useState("6");
  const [speed, setSpeed] = useState("6");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddBird = () => {
    setMessage("");
    setError("");

    const trimmedName = name.trim();
    const trimmedTrait = trait.trim();
    const parsedPower = Number(power);
    const parsedSpeed = Number(speed);

    if (trimmedName.length < 2) {
      setError("鸟类名称至少 2 个字符");
      return;
    }

    if (trimmedTrait.length < 6) {
      setError("技能描述至少 6 个字符");
      return;
    }

    if (!Number.isInteger(parsedPower) || parsedPower < 1 || parsedPower > 10) {
      setError("威力必须是 1 到 10 的整数");
      return;
    }

    if (!Number.isInteger(parsedSpeed) || parsedSpeed < 1 || parsedSpeed > 10) {
      setError("速度必须是 1 到 10 的整数");
      return;
    }

    const nextBird: BirdPrototype = {
      id: `bird-${birds.length + 1}`,
      name: trimmedName,
      trait: trimmedTrait,
      power: parsedPower,
      speed: parsedSpeed,
    };

    setBirds((current) => [nextBird, ...current]);
    setName("");
    setTrait("");
    setPower("6");
    setSpeed("6");
    setMessage(`已为设计师 ${nickname} 添加新的鸟类原型`);
  };

  return (
    <section className="panel">
      <div className="feature-header">
        <div>
          <h2>鸟类开发</h2>
          <p className="panel-copy">配置新鸟种的定位、技能和属性，作为后续内容设计的前端草案。</p>
        </div>
        <div className="feature-pill">设计实验室</div>
      </div>

      <div className="feature-grid">
        <section className="feature-card">
          <h3>新建鸟类原型</h3>
          <label>
            <span>名称</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span>技能描述</span>
            <textarea rows={4} value={trait} onChange={(event) => setTrait(event.target.value)} />
          </label>
          <div className="feature-inline-fields">
            <label>
              <span>威力</span>
              <input value={power} onChange={(event) => setPower(event.target.value)} />
            </label>
            <label>
              <span>速度</span>
              <input value={speed} onChange={(event) => setSpeed(event.target.value)} />
            </label>
          </div>
          <button type="button" onClick={handleAddBird}>
            保存原型
          </button>
          {message ? <p className="feedback success">{message}</p> : null}
          {error ? <p className="feedback error">{error}</p> : null}
        </section>

        <section className="feature-card">
          <h3>当前原型</h3>
          <div className="feature-stack">
            {birds.map((bird) => (
              <article key={bird.id} className="mini-card">
                <div className="mini-card-header">
                  <strong>{bird.name}</strong>
                  <span>
                    威力 {bird.power} / 速度 {bird.speed}
                  </span>
                </div>
                <p>{bird.trait}</p>
                <p className="meta">原型编号：{bird.id}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
};
