import React, { useEffect, useState } from "react";
import CassaApi from "../services/CassaApi";

export default function DettaglioCassa({id_turno, id_anag}) {
  const [cassa, setCassa] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);

    const recuperaCassa = () => {
      console.log("recuperaCassa");
      CassaApi.recuperaCassa(id_anag, id_turno).then((response) => {
        setCassa(response);
        setIsLoading(false);
      });
    };

    if(id_turno && id_anag) recuperaCassa();

  }, [id_turno, id_anag]);

  if (isLoading) {
    return (
      <>
        <h3>...loading</h3>
      </>
    );
  }

  return (
    <>
      <h2>Cassa</h2>
      <h1>{cassa.cognome} {cassa.nome}</h1>
      <ul>
        {cassa &&
          cassa?.inserimenti?.map((data) => {
            return (
              <li key={data.id}>
                {data.insert_date} {data.type} {data.value} 
              </li>
            );
          })}
      </ul>
    </>
  );
}
