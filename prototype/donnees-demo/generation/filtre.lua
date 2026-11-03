-- Filtre pandoc : blocs alignés à droite (::: droite) ou centrés (::: centre)
-- et sauts de page (::: saut), pour les en-têtes de courrier et les signatures.
local environnements = { droite = "flushright", centre = "center" }

function Div(el)
  if el.classes:includes("saut") then
    if FORMAT:match("latex") then
      return pandoc.RawBlock("latex", "\\newpage")
    elseif FORMAT:match("docx") then
      return pandoc.RawBlock("openxml", '<w:p><w:r><w:br w:type="page"/></w:r></w:p>')
    end
    return {}
  end
  for classe, environnement in pairs(environnements) do
    if el.classes:includes(classe) then
      if FORMAT:match("latex") then
        local blocs = { pandoc.RawBlock("latex", "\\begin{" .. environnement .. "}") }
        for _, bloc in ipairs(el.content) do table.insert(blocs, bloc) end
        table.insert(blocs, pandoc.RawBlock("latex", "\\end{" .. environnement .. "}"))
        return blocs
      elseif FORMAT:match("docx") then
        el.attributes["custom-style"] = classe == "droite" and "Bloc à droite" or "Bloc centré"
        return el
      end
    end
  end
end
