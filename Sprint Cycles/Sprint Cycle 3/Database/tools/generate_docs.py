"""Generate the Data Dictionary and ERD source from the live MySQL database.

Reads information_schema for the rattler_resource_rescue database, so the
documents always match the implemented schema (column comments are the
descriptions). Writes, relative to the Sprint Cycle 3 folder:

  Data Dictionary/Rattler_Resource_Rescue_Data_Dictionary.xlsx
  Data Dictionary/Data-Dictionary.md
  ERD/erd-*.mmd  (Mermaid source for the full ERD and four areas)

Usage (after loading 01_schema.sql and 02_sample_data.sql):
  pip install openpyxl
  python3 tools/generate_docs.py [--user root] [--password ...] [--host localhost]
"""
import argparse
import os
import re
import subprocess
from collections import defaultdict

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

DB = 'rattler_resource_rescue'
HERE = os.path.dirname(os.path.abspath(__file__))
SPRINT = os.path.normpath(os.path.join(HERE, '..', '..'))

# Logical order and the four ERD areas.
AREAS = [
    ('ERD-1-Users-Roles-Organizations', 'Users, Roles, Organizations & Audit',
     ['user', 'role', 'permission', 'role_permission', 'organization', 'organization_member', 'audit_log', 'notification', 'system_setting'], []),
    ('ERD-2-Items-Reservations-Exchanges', 'Items, Reservations, Exchanges & Messages',
     ['category', 'item', 'item_image', 'reservation', 'exchange', 'message'], ['user', 'organization']),
    ('ERD-3-Collection-Drives', 'Collection Drives & Giveaways',
     ['collection_event', 'event_category', 'event_item'], ['organization', 'user', 'category', 'item']),
    ('ERD-4-Reports-Moderation', 'Reports & Moderation',
     ['report', 'moderation_case', 'moderation_action'], ['user', 'organization', 'item', 'exchange', 'collection_event']),
]
ORDER = [t for _, _, main, _ in AREAS for t in main]

# Design changes made in Sprint Cycle III, shown in the dictionary and marked NEW.
# (table, column or None for a new table, 'NEW' or 'CHANGED', reason)
SPRINT3_CHANGES = [
    ('user', 'email_verified_at', 'NEW', 'Business rule: a verified campus email is required to list or reserve'),
    ('user', 'email', 'CHANGED', 'CHECK constraint: must be a @famu.edu campus email'),
    ('item', 'quantity', 'NEW', 'Business rule: giveaway listings must state a quantity'),
    ('item', 'status', 'CHANGED', 'Added "Pending Review" for the moderator Review Listings screen'),
    ('reservation', 'status', 'CHANGED', 'Added "Pending" for the department Approve Requests screen'),
    ('reservation', 'open_item_id', 'NEW', 'Generated column + unique index: one open reservation per item'),
    ('moderation_action', 'reason', 'NEW', 'Business rule: every moderation action records a reason (was optional notes)'),
    ('audit_log', None, 'NEW', 'New table: administrator account actions must log a justification'),
]


def query(args, sql):
    cmd = ['mysql', '-B', '-N', '--raw', '-u', args.user, '-h', args.host, '-e', sql]
    if args.password:
        cmd.insert(1, f'-p{args.password}')
    out = subprocess.run(cmd, check=True, capture_output=True, text=True).stdout
    return [line.split('\t') for line in out.splitlines() if line]


def load(args):
    tables = {r[0]: r[1] for r in query(args, f"""
        SELECT table_name, table_comment FROM information_schema.tables
        WHERE table_schema='{DB}' AND table_type='BASE TABLE'""")}
    counts = {t: query(args, f'SELECT COUNT(*) FROM {DB}.`{t}`')[0][0] for t in tables}
    cols = defaultdict(list)
    for t, c, typ, nullable, key, default, extra, comment in query(args, f"""
        SELECT table_name, column_name, UPPER(column_type), is_nullable, column_key,
               IFNULL(column_default, '\\\\N'), extra, column_comment
        FROM information_schema.columns WHERE table_schema='{DB}'
        ORDER BY table_name, ordinal_position"""):
        cols[t].append(dict(name=c, type=typ, nullable=nullable == 'YES', key=key,
                            default=None if default == '\\N' else default, extra=extra, comment=comment))
    pks = defaultdict(set)
    for t, c in query(args, f"""SELECT table_name, column_name FROM information_schema.key_column_usage
        WHERE table_schema='{DB}' AND constraint_name='PRIMARY'"""):
        pks[t].add(c)
    fks = []
    for t, c, rt, rc, name in query(args, f"""SELECT table_name, column_name, referenced_table_name,
        referenced_column_name, constraint_name FROM information_schema.key_column_usage
        WHERE table_schema='{DB}' AND referenced_table_name IS NOT NULL ORDER BY table_name, constraint_name"""):
        fks.append(dict(table=t, column=c, ref_table=rt, ref_column=rc, name=name))
    uniques = defaultdict(list)  # table -> list of column tuples (single-column unique only matter for UK)
    for t, name, colnames in query(args, f"""SELECT tc.table_name, tc.constraint_name,
        GROUP_CONCAT(k.column_name ORDER BY k.ordinal_position)
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage k
          ON k.constraint_schema=tc.constraint_schema AND k.table_name=tc.table_name AND k.constraint_name=tc.constraint_name
        WHERE tc.table_schema='{DB}' AND tc.constraint_type='UNIQUE'
        GROUP BY tc.table_name, tc.constraint_name"""):
        uniques[t].append(tuple(colnames.split(',')))
    checks = defaultdict(list)
    for t, name, clause in query(args, f"""SELECT tc.table_name, cc.constraint_name, cc.check_clause
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc
          ON tc.constraint_schema=cc.constraint_schema AND tc.constraint_name=cc.constraint_name
        WHERE cc.constraint_schema='{DB}'"""):
        checks[t].append((name, clause))
    return tables, counts, cols, pks, fks, uniques, checks


def is_generated(col):
    return 'STORED GENERATED' in col['extra'].upper() or 'VIRTUAL GENERATED' in col['extra'].upper()


def pretty_check(clause):
    c = clause.replace('`', '').replace("\\'", "'")
    c = re.sub(r"_[a-z0-9]+'", "'", c)
    c = re.sub(r'\s+', ' ', c)
    return c.strip()


def build(args):
    tables, counts, cols, pks, fks, uniques, checks = load(args)
    fk_by_col = {(f['table'], f['column']): f for f in fks}
    new_cols = {(t, c): kind for t, c, kind, _ in SPRINT3_CHANGES if c}
    new_tables = {t for t, c, _, _ in SPRINT3_CHANGES if c is None}

    rows = []
    for t in ORDER:
        single_uq = {u[0] for u in uniques[t] if len(u) == 1}
        multi_uq = [u for u in uniques[t] if len(u) > 1]
        for col in cols[t]:
            n = col['name']
            is_pk, fk = n in pks[t], fk_by_col.get((t, n))
            key = 'PK, FK' if is_pk and fk else 'PK' if is_pk else 'FK' if fk else 'Neither'
            notes = []
            if 'auto_increment' in col['extra']:
                notes.append('Auto-increment')
            if is_generated(col):
                notes.append('Generated (stored)')
            if n in single_uq:
                notes.append('Unique')
            for u in multi_uq:
                if n in u:
                    notes.append(f'Unique together ({", ".join(u)})')
            if fk:
                notes.append(f"References {fk['ref_table'].upper()}.{fk['ref_column']}")
            if col['default'] is not None and 'auto_increment' not in col['extra']:
                d = col['default']
                notes.append('Default ' + ('now' if 'CURRENT_TIMESTAMP' in d.upper() else
                                           'TRUE' if d == '1' and col['type'].startswith('TINYINT') else
                                           'FALSE' if d == '0' and col['type'].startswith('TINYINT') else d))
            for name, clause in checks[t]:
                if re.search(rf'\b{n}\b', clause):
                    notes.append(f'CHECK {name}: {pretty_check(clause)}')
            if t in new_tables or new_cols.get((t, n)) == 'NEW':
                notes.insert(0, 'NEW in Sprint III.')
            elif new_cols.get((t, n)) == 'CHANGED':
                notes.insert(0, 'Changed in Sprint III.')
            dtype = col['type'].replace('TINYINT(1)', 'BOOLEAN')
            required = 'Generated' if is_generated(col) else ('No' if col['nullable'] else 'Yes')
            rows.append((t.upper(), n, col['comment'], dtype, key, required, ' '.join(n_.rstrip('.') + '.' for n_ in notes)))

    rels = []
    for f in fks:
        t, c = f['table'], f['column']
        col = next(x for x in cols[t] if x['name'] == c)
        child_unique = (c,) in [u for u in uniques[t]] or pks[t] == {c}
        parent = '0..1' if col['nullable'] else '1'
        child = '0..1' if child_unique else '0..M'
        rels.append((f['ref_table'].upper(), f'{parent} : {child}', t.upper(), c, f['name']))

    write_xlsx(rows, rels, tables, counts, pks)
    write_md(rows, rels, tables)
    write_mermaid(cols, pks, fks, uniques, fk_by_col, new_cols, new_tables)
    print(f'{len(ORDER)} tables, {len(rows)} fields, {len(rels)} relationships')


def write_xlsx(rows, rels, tables, counts, pks):
    wb = Workbook()
    head_font, head_fill = Font(bold=True, color='FFFFFF'), PatternFill('solid', fgColor='14301F')
    new_fill = PatternFill('solid', fgColor='FDE7D2')
    thin = Side(style='thin', color='BFBFBF')
    border, wrap = Border(left=thin, right=thin, top=thin, bottom=thin), Alignment(wrap_text=True, vertical='top')

    def sheet(ws, headers, data, widths, highlight=lambda r: False):
        ws.append(headers)
        for c in ws[1]:
            c.font, c.fill, c.alignment, c.border = head_font, head_fill, wrap, border
        for r in data:
            ws.append(list(r))
            for c in ws[ws.max_row]:
                c.alignment, c.border = wrap, border
                if highlight(r):
                    c.fill = new_fill
        for i, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(i)].width = w
        ws.freeze_panes, ws.auto_filter.ref = 'A2', ws.dimensions

    ws = wb.active
    ws.title = 'Data Dictionary'
    sheet(ws, ['Entity', 'Attribute / Field Name', 'Description', 'Data Type', 'Key Type', 'Required?', 'Constraints / Notes'],
          rows, [22, 26, 46, 22, 10, 11, 70], lambda r: r[6].startswith(('NEW', 'Changed')))
    sheet(wb.create_sheet('Entities'), ['Entity', 'Description', 'Primary Key', 'Sample Rows'],
          [(t.upper(), tables[t], ', '.join(sorted(pks[t])), int(counts[t])) for t in ORDER], [22, 70, 28, 12])
    sheet(wb.create_sheet('Relationships'), ['Parent Entity', 'Cardinality (parent : child)', 'Child Entity', 'Foreign Key', 'Constraint'],
          rels, [20, 26, 22, 28, 28])
    sheet(wb.create_sheet('Sprint III Changes'), ['Entity', 'Field', 'New / Changed', 'Change and reason'],
          [(t.upper(), c or '(new table)', kind.title(), why) for t, c, kind, why in SPRINT3_CHANGES], [20, 22, 90])
    wb.save(os.path.join(SPRINT, 'Data Dictionary', 'Rattler_Resource_Rescue_Data_Dictionary.xlsx'))


def write_md(rows, rels, tables):
    esc = lambda s: str(s).replace('|', '\\|')
    out = ['# Data Dictionary – Rattler Resource Rescue System (Sprint Cycle III)', '',
           'Generated from the implemented MySQL database by `Database/tools/generate_docs.py`, so it always matches '
           '`Database/01_schema.sql`. Fields marked **NEW** or **Changed in Sprint III** were added or changed while implementing the design.', '',
           '**Key Type:** PK = primary key, FK = foreign key, PK, FK = part of a composite primary key that is also a foreign key.', '',
           '## Entities', '']
    out += [f'- [{t.upper()}](#{t}) – {tables[t]}' for t in ORDER]
    for t in ORDER:
        out += ['', f'## {t.upper()}', '', tables[t], '',
                '| Field | Description | Data Type | Key | Required | Constraints / Notes |', '|---|---|---|---|---|---|']
        out += ['| ' + ' | '.join(esc(x) for x in (f'`{r[1]}`',) + r[2:]) + ' |' for r in rows if r[0] == t.upper()]
    out += ['', '## Relationships', '', '| Parent | Cardinality | Child | Foreign Key |', '|---|---|---|---|']
    out += [f'| {p} | {c} | {ch} | `{fk}` |' for p, c, ch, fk, _ in rels]
    out += ['', '## Sprint III changes', '', '| Entity | Field | New / Changed | Change and reason |', '|---|---|---|---|']
    out += [f'| {t.upper()} | {c or "(new table)"} | {kind.title()} | {esc(why)} |' for t, c, kind, why in SPRINT3_CHANGES]
    with open(os.path.join(SPRINT, 'Data Dictionary', 'Data-Dictionary.md'), 'w') as f:
        f.write('\n'.join(out) + '\n')


def write_mermaid(cols, pks, fks, uniques, fk_by_col, new_cols, new_tables):
    def ent(t, ref_only):
        lines = [f'    {t.upper()} {{']
        for c in cols[t]:
            n = c['name']
            if ref_only and n not in pks[t]:
                continue
            keys = [k for k, ok in (('PK', n in pks[t]), ('FK', (t, n) in fk_by_col)) if ok]
            if (n,) in uniques[t] and 'PK' not in keys:
                keys.append('UK')
            kind = 'NEW' if t in new_tables else {'NEW': 'NEW', 'CHANGED': 'changed'}.get(new_cols.get((t, n)), '')
            tags = (['optional'] if c['nullable'] else []) + ([kind] if kind else [])
            dtype = re.sub(r'[^A-Za-z0-9(),_]', '', c['type'].replace('TINYINT(1)', 'BOOLEAN').split(' ')[0])
            lines.append('        ' + ' '.join(x for x in (dtype, n, ','.join(keys), f'"{", ".join(tags)}"' if tags else '') if x))
        lines.append('    }')
        return lines

    def rel(f):
        t, c = f['table'], f['column']
        nullable = next(x for x in cols[t] if x['name'] == c)['nullable']
        child_one = (c,) in uniques[t] or pks[t] == {c}
        notation = ('|o' if nullable else '||') + '--' + ('o|' if child_one else 'o{')
        return f'    {f["ref_table"].upper()} {notation} {t.upper()} : "{c}"'

    def diagram(title, main, refs):
        lines = ['---', f'title: {title}', '---', 'erDiagram']
        for t in main:
            lines += ent(t, False)
        for t in refs:
            lines += ent(t, True)
        shown = set(main) | set(refs)
        lines += [rel(f) for f in fks if f['table'] in shown and f['ref_table'] in shown
                  and (f['table'] in main or f['ref_table'] in main)]
        return '\n'.join(lines) + '\n'

    erd_dir = os.path.join(SPRINT, 'ERD')
    os.makedirs(erd_dir, exist_ok=True)
    with open(os.path.join(erd_dir, 'Sprint-III-ERD.mmd'), 'w') as f:
        f.write(diagram("Rattler Resource Rescue System — Sprint III ERD (as implemented)", ORDER, []))
    for stem, title, main, refs in AREAS:
        with open(os.path.join(erd_dir, f'{stem}.mmd'), 'w') as f:
            f.write(diagram(f'Rattler Resource Rescue System — {title}', main, refs))


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument('--user', default='root')
    p.add_argument('--password', default='')
    p.add_argument('--host', default='localhost')
    build(p.parse_args())
