import React, { useEffect, useState } from "react";
import TurniApi from "../services/TurniApi";
import "../styles/main.css"

export default function ElencoPresenzeTurno({idTurno, anagraficaSelezionata}) {
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

  const selezionaAnagrafica = (anagrafica) => {
    console.log("anagrafica", anagrafica);
    anagraficaSelezionata(anagrafica);
  }


  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>

    <div class="background_red">
      <h2>Presenze</h2>
      <ul>
        {presenze &&
          presenze.map((data) => {
            return (
              <li key={data.idanag}>
                <button key={data.id} onClick={() => selezionaAnagrafica(data)}>
                  {data.nome} {data.cognome}
                </button>
              </li>
            );
          })}
      </ul>
      </div>
    </>
  );
}
