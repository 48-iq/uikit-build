import axios from "axios";
export default function MyButton(props: {
  children?: React.ReactNode,
  boolVal: boolean
}) {  

  async function handleClick() {
    await axios.get(`localhost:3000/api/hello`).catch((err) => console.log(err));
  }
  return <button onClick={handleClick}>Кнопка coca-cola</button>;
};
