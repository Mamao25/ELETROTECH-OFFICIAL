import React, {createContext, useContext, useId, useState} from 'react';
import locations from './home-locations.json';

const Group = createContext('all-fields');
const dedicatedRegions = {
  services: 'Serviços',
  equipment: 'Equipamentos',
  oxifish: 'OxiLife Fish',
};

export function HomeInput(props) {
  const selected = props.groups?.find(group => group.selected)?.name ?? 'all-fields';
  return <Group.Provider value={selected}>{props.renderDefault(props)}</Group.Provider>;
}

export function HomeArray(props) {
  const group = useContext(Group);
  const [region, setRegion] = useState('');
  const id = useId();
  const byKey = new Map((props.value ?? []).map(item => [item._key, locations[item.key] ?? 'Outros']));
  const dedicated = dedicatedRegions[group];
  const general = ['texts', 'media', 'links'].includes(group);
  const available = dedicated
    ? props.members.filter(member => byKey.get(member.key) === dedicated)
    : props.members.filter(member => !general || !Object.values(dedicatedRegions).includes(byKey.get(member.key)));
  const regions = [...new Set(available.map(member => byKey.get(member.key)).filter(Boolean))];
  const selected = regions.includes(region) ? region : '';
  const focused = props.focusPath?.[0]?._key;
  const members = selected && !dedicated
    ? available.filter(member => member.key === focused || byKey.get(member.key) === selected)
    : available;

  return <>
    {!dedicated && regions.length > 1 && <label htmlFor={id} style={{display: 'block', marginBottom: 12}}>
      Parte da página{' '}
      <select id={id} value={selected} onChange={event => setRegion(event.target.value)}>
        <option value="">Todas</option>
        {regions.map(name => <option key={name}>{name}</option>)}
      </select>
    </label>}
    {props.renderDefault({...props, members})}
  </>;
}
