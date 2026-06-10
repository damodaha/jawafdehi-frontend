const defaultValues: Record<string, string> = {
  page: "1",
  sort: "relevance",
};
const validSorts = new Set(["relevance", "newest", "oldest", "title"]);
const validTypes = new Set(["case", "entity", "document"]);

export function normalizeArchiveSearchParams(current: URLSearchParams) {
  const next = new URLSearchParams(current);

  const page = next.get("page");
  if (!page || !/^\d+$/.test(page) || Number(page) <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(Number(page)));
  }

  const sort = next.get("sort");
  if (!sort || sort === defaultValues.sort || !validSorts.has(sort)) {
    next.delete("sort");
  } else {
    next.set("sort", sort);
  }

  const type = next.get("type");
  if (!type || type === "all" || !validTypes.has(type)) {
    next.delete("type");
  } else {
    next.set("type", type);
  }

  return next;
}

export function setArchiveSearchParam(
  current: URLSearchParams,
  name: string,
  value?: string | number,
) {
  const next = new URLSearchParams(current);
  const stringValue = value === undefined ? "" : String(value);

  if (!stringValue || defaultValues[name] === stringValue) {
    next.delete(name);
  } else {
    next.set(name, stringValue);
  }

  return normalizeArchiveSearchParams(next);
}

export function toggleArchiveSearchParam(
  current: URLSearchParams,
  name: string,
  value: string,
  multiple = true,
) {
  const next = new URLSearchParams(current);

  if (!multiple) {
    if (next.get(name) === value) next.delete(name);
    else next.set(name, value);
  } else {
    const selected = new Set(next.getAll(name));
    if (selected.has(value)) selected.delete(value);
    else selected.add(value);

    next.delete(name);
    selected.forEach((item) => next.append(name, item));
  }

  next.delete("page");
  return normalizeArchiveSearchParams(next);
}
