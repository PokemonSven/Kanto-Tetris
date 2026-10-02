// Pokémon progress is keyed by species. Team/PC slots must reference each record once.
function normalizeRunRoster(run){
 const team=[...new Set(run.team||[])],pc=[...new Set(run.pc||[])];
 run.team=team;
 run.pc=pc.filter(dex=>!team.includes(dex));
 if(run.buddy&&!team.includes(run.buddy))run.buddy=team.find(dex=>run.collection?.[dex]?.currentHP>0)||team[0]||null;
 return run;
}
