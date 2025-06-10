import React, { useEffect, useState } from "react";
import TurniApi from "../services/TurniApi";

export default function ElencoPresenzeTurno({idTurno}) {
  const [presenze, setPresenze] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("reload?!?");
    setIsLoading(true);

    const recuperaPresenzeTurno = () => {
      TurniApi.recuperaDettaglioTurno(idTurno).then((response) => {
        setPresenze(response);
        setIsLoading(false);
      });
    };

    if(idTurno) recuperaPresenzeTurno();

  }, [idTurno]);

  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>
      <h2>Presenze</h2>
      <ul>
        {presenze &&
          presenze.map((data) => {
            return (
              <li key={data.idanag}>
                {data.nome} {data.cognome}
              </li>
            );
          })}
      </ul>
    </>
  );
}
