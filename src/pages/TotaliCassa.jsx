import React, { useEffect, useState } from "react";
import CassaApi from "../services/CassaApi";
import AnagraficaApi from "../services/AnagraficaApi";
import "../styles/main.css"

export default function TotaliCassa({id_turno}) {
  const [riepilogoCassa, setRiepilogoCassa] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const recuperaTotaliCassa = () => {
      console.log("recuperaTotaliCassa");
      CassaApi.recuperaTotaliCassa(id_turno).then((response) => {
        setRiepilogoCassa(response);
        setIsLoading(false);
      });
    };

    if(id_turno) recuperaTotaliCassa();

  }, [id_turno]);

  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>    
    <div class="background_darkcyan">
      <h2>Totali Cassa</h2>      
      <table class="simple_table">
        <thead>
          <tr>
            <th>tipo</th>
            <th>valore</th>
          </tr>
        </thead>
        <tbody>
        {riepilogoCassa &&
          riepilogoCassa?.map((data) => {
            return (
              <tr key={data.type}>
                <td>{data.type}</td>
                <td>{data.value}</td>
              </tr>
            );
          })}
          </tbody>
      </table>

        </div>
    </>
  );
}
