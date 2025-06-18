import re
from pathlib import Path
from typing import Optional


def parse_table(sql: str, table: str) -> list[tuple[str, str]]:
    pattern = rf"CREATE TABLE public.{table} \((.*?)\);"
    m = re.search(pattern, sql, re.S)
    if not m:
        raise ValueError(f"Table {table} not found")
    body = m.group(1)
    cols = []
    for line in body.splitlines():
        line = line.strip().rstrip(',')
        if not line or line.startswith('CONSTRAINT'):
            continue
        name, type_ = line.split()[:2]
        if type_ == 'uuid':
            py = 'UUID'
        elif type_.startswith('timestamp'):
            py = 'datetime'
        elif type_ == 'jsonb':
            py = 'dict'
        elif type_ == 'text':
            py = 'str'
        elif type_ == 'integer':
            py = 'int'
        else:
            py = 'str'
        cols.append((name, py))
    return cols


def render_py(table: str, cols: list[tuple[str, str]]) -> str:
    lines = [
        'from __future__ import annotations',
        '',
        'from datetime import datetime',
        'from uuid import UUID',
        'from typing import Optional',
        '',
        'from pydantic import BaseModel',
        '',
        f'class {table.rstrip("s").title().replace("_", "")}(BaseModel):',
    ]
    for name, typ in cols:
        lines.append(f'    {name}: Optional[{typ}] = None')
    lines.append('')
    return "\n".join(lines)


def render_ts(table: str, cols: list[tuple[str, str]]) -> str:
    type_map = {
        'UUID': 'string',
        'datetime': 'string',
        'int': 'number',
        'str': 'string',
        'dict': 'Record<string, any>',
    }
    lines = [f'export interface {table.rstrip("s").title().replace("_", "")} {{']
    for name, typ in cols:
        ts_type = type_map.get(typ, 'any')
        lines.append(f'  {name}?: {ts_type};')
    lines.append('}')
    return "\n".join(lines)


def main() -> None:
    sql = Path('docs/SCHEMA_SNAPSHOT.sql').read_text()
    out_dir = Path('api/src/app/models')
    out_dir.mkdir(parents=True, exist_ok=True)
    tables = ['blocks', 'baskets', 'events']
    for table in tables:
        cols = parse_table(sql, table)
        model_py = render_py(table, cols)
        Path(out_dir / f'{table[:-1]}.py').write_text(model_py)
    ts_lines = [render_ts(t, parse_table(sql, t)) for t in tables]
    Path('web/lib/dbTypes.ts').write_text('\n\n'.join(ts_lines) + '\n')
    print('Pydantic models and TypeScript types generated.')


if __name__ == '__main__':
    main()
