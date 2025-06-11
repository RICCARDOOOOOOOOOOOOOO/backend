import React, { useEffect, useState } from "react";
import TurniApi from "../services/TurniApi";
import "../styles/main.css";

export default function ElencoTurni({ turnoSelezionato }) {
  const [turni, setTurni] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    recuperaTurni();
  }, []);

  const recuperaTurni = () => {
    TurniApi.recuperaTurni().then((response) => {
      setTurni(response);
      setIsLoading(false);
    });
  };

  const selezionaTurno = (turno) => {
    console.log("turno", turno);
    turnoSelezionato(turno);
  };

  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>
      <div class="background_blue">
        <h2>Turni</h2>
        <button onClick={() => recuperaTurni()}>ricarica turni</button>
        <hr></hr>

        {turni &&
          turni.map((data) => {
            return (              
              <button key={data.id} onClick={() => selezionaTurno(data)}>
                {data.titolo} {data.inizio}
              </button>
            );
          })}
      </div>
    </>
  );
}
