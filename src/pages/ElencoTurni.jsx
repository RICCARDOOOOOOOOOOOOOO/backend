import React, { useEffect, useState } from "react";
import TurniApi from "../services/TurniApi";

export default function ElencoTurni({turnoSelezionato}) {
  const [turni, setTurni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const recuperaTurni = () => {
      TurniApi.recuperaTurni().then((response) => {
        setTurni(response);
        setIsLoading(false);
      });
    };

    recuperaTurni();
  }, []);

  const selezionaTurno = (turno) => {
    console.log("turno", turno);
    turnoSelezionato(turno);
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
      <h2>Turni</h2>
        {turni &&
          turni.map((data) => {
            return (
              <button key={data.id} onClick={() => selezionaTurno(data)}>
                {data.titolo} {data.inizio}
              </button>
            );
          })}
    </>
  );
}
