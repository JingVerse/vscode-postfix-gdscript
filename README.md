# GDScript Postfix Completion

Postfix completion templates for GDScript (Godot Engine) in VS Code.

Inspired by PyCharm's postfix completion — type `expr.print` and it expands to `print(expr)`, with `expr` correctly consumed.

## Usage

Type an expression followed by `.` and a template name, then press `Tab` or `Enter`.

```gdscript
enemy_health.print     →  print(enemy_health)
nodes.forin            →  for item in nodes:
result.ifnn            →  if result != null:
get_node("X").emit     →  get_node("X").emit()
my_array.len           →  len(my_array)
value.int              →  int(value)
```

## Templates

### Output
| Postfix    | Result                  |
|------------|-------------------------|
| `.print`   | `print(expr)`           |
| `.printd`  | `print_debug(expr)`     |
| `.printerr`| `printerr(expr)`        |

### Control Flow
| Postfix     | Result                    |
|-------------|---------------------------|
| `.return`   | `return expr`             |
| `.if`       | `if expr:`                |
| `.ifn`      | `if expr == null:`        |
| `.ifnn`     | `if expr != null:`        |
| `.not`      | `if not expr:`            |
| `.while`    | `while expr:`             |
| `.forloop`  | `for i in range(expr):`   |
| `.forin`    | `for item in expr:`       |

### Type Conversion
| Postfix  | Result          |
|----------|-----------------|
| `.int`   | `int(expr)`     |
| `.float` | `float(expr)`   |
| `.str`   | `str(expr)`     |
| `.bool`  | `bool(expr)`    |
| `.type`  | `typeof(expr)`  |

### Collections
| Postfix     | Result                  |
|-------------|-------------------------|
| `.len`      | `len(expr)`             |
| `.size`     | `expr.size()`           |
| `.is_empty` | `expr.is_empty()`       |
| `.append`   | `expr.append(item)`     |
| `.push`     | `expr.push_back(item)`  |
| `.has`      | `expr.has(key)`         |
| `.clear`    | `expr.clear()`          |

### Signals & Misc
| Postfix    | Result                     |
|------------|----------------------------|
| `.emit`    | `expr.emit()`              |
| `.connect` | `expr.connect(callable)`   |
| `.await`   | `await expr`               |
| `.assert`  | `assert(expr)`             |
| `.as`      | `expr as Type`             |

## Configuration

Disable specific templates in `settings.json`:

```json
"postfix-gdscript.disabledTemplates": ["str", "bool"]
```

## Requirements

- VS Code 1.75+
- [Godot Tools](https://marketplace.visualstudio.com/items?itemName=geequlim.godot-tools) extension (for GDScript language support)
