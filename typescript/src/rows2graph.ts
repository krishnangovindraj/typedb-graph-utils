import {
    Attribute, AttributeType, Concept, ConceptRow, ConceptRowsQueryResponse, Entity, EntityType, InstantiableType,
    getVariableName, ConstraintVertexAny,
    Relation, RelationType, RoleType, Type, Value, AnalyzedPipeline, ConstraintAny, ConceptRowAnswer
} from "@typedb/driver-http";
import {DataConstraintAny, DataGraph, DataVertex, QueryCoordinates, VertexUnavailable} from "./data_constraint";
import {TypeDBAnswerConverter} from "./converter";

// TODO: Remove this function and just export DataGraphBuilder
export function constructDataGraphFromRowsResult(rows_result: ConceptRowsQueryResponse): DataGraph {
    return DataGraphBuilder.build(rows_result);
}

export class DataGraphBuilder {
    structure: AnalyzedPipeline;
    constructor(structure: AnalyzedPipeline) {
        this.structure = structure;
    }

    static build(rows_result: ConceptRowsQueryResponse): DataGraph {
        let builder = new DataGraphBuilder(rows_result.query!);
        let answers: DataConstraintAny[][] = [];
        rows_result.answers.forEach((row, answerIndex) => {
            answers.push(builder.buildAnswer(answerIndex, row));
        });
        return {answers: answers};
    }

    buildAnswer(answerIndex: number, row: ConceptRowAnswer): DataConstraintAny[] {
        return row.involvedBlocks!.flatMap(branchIndex => {
            return this.structure.conjunctions[branchIndex].constraints.map((constraint, constraintIndex) => {
                let queryCoordinates = { branch: branchIndex, constraint: constraintIndex };
                return this.toDataConstraint(answerIndex, constraint, row.data, queryCoordinates);
            }).filter(x => x != null);
        });
    }

    private translate_vertex(structure_vertex: ConstraintVertexAny, answerIndex: number, data: ConceptRow): DataVertex {
        switch (structure_vertex.tag) {
            case "variable": {
                let name = getVariableName(this.structure, structure_vertex);
                if (name != null && data[name] != null ) {
                    return data[name]!;
                } else {
                    let nameOrId = name ?? `$_${structure_vertex.id}`;
                    let key = `unavailable[${nameOrId}][${answerIndex}]`;
                    return {
                        kind: "unavailable",
                        vertex_map_key: key,
                        answerIndex: answerIndex,
                        variable: nameOrId,
                    } as VertexUnavailable;
                }
            }
            case "label": {
                let vertex = structure_vertex.type;
                return {kind: vertex.kind, label: vertex.label} as Type;
            }
            case "value": {
                return structure_vertex.value;
            }
            case "namedRole": {
                return { kind: "roleType", label: structure_vertex.name };
            }
        }
    }

    private toDataConstraint(answerIndex: number, constraint: ConstraintAny, data: ConceptRow, coordinates: QueryCoordinates): DataConstraintAny | null{
        switch (constraint.tag) {
            case "isa": {
                return {
                    tag: "isa",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    instance: this.translate_vertex(constraint.instance, answerIndex, data) as (Entity | Relation | Attribute | VertexUnavailable),
                    type: this.translate_vertex(constraint.type, answerIndex, data) as (InstantiableType | VertexUnavailable),
                }
            }
            case "isa!": {
                return {
                    tag: "isa!",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    instance: this.translate_vertex(constraint.instance, answerIndex, data) as (Entity | Relation | Attribute | VertexUnavailable),
                    type: this.translate_vertex(constraint.type, answerIndex, data) as (InstantiableType | VertexUnavailable),
                }
            }
            case "has": {
                return {
                    tag: "has",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    owner: this.translate_vertex(constraint.owner, answerIndex, data) as (Entity | Relation | VertexUnavailable),
                    attribute: this.translate_vertex(constraint.attribute, answerIndex, data) as (Attribute | VertexUnavailable),
                }
            }
            case "links": {
                return {
                    tag: "links",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    relation: this.translate_vertex(constraint.relation, answerIndex, data) as (Relation | VertexUnavailable),
                    player: this.translate_vertex(constraint.player, answerIndex, data) as (Entity | Relation | VertexUnavailable),
                    role: this.translate_vertex(constraint.role, answerIndex, data) as (RoleType | VertexUnavailable),
                }
            }
            case "sub": {
                return {
                    tag: "sub",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    subtype: this.translate_vertex(constraint.subtype, answerIndex, data) as (Type | VertexUnavailable),
                    supertype: this.translate_vertex(constraint.supertype, answerIndex, data) as (Type | VertexUnavailable),
                }
            }
            case "sub!": {
                return {
                    tag: "sub!",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    subtype: this.translate_vertex(constraint.subtype, answerIndex, data) as (Type | VertexUnavailable),
                    supertype: this.translate_vertex(constraint.supertype, answerIndex, data) as (Type | VertexUnavailable),
                }
            }
            case "owns": {
                return {
                    tag: "owns",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    owner: this.translate_vertex(constraint.owner, answerIndex, data) as (EntityType | RelationType | VertexUnavailable),
                    attribute: this.translate_vertex(constraint.attribute, answerIndex, data) as (AttributeType | VertexUnavailable),
                }
            }
            case "relates": {
                return {
                    tag: "relates",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    relation: this.translate_vertex(constraint.relation, answerIndex, data) as (RelationType | VertexUnavailable),
                    role: this.translate_vertex(constraint.role, answerIndex, data) as (RoleType | VertexUnavailable),
                }
            }
            case "plays": {
                return {
                    tag: "plays",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    player: this.translate_vertex(constraint.player, answerIndex, data) as (EntityType | RelationType | VertexUnavailable),
                    role: this.translate_vertex(constraint.role, answerIndex, data) as (RoleType | VertexUnavailable),
                }
            }
            case "expression": {
                return {
                    tag: "expression",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    text: constraint.text,
                    arguments: constraint.arguments.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                    assigned: this.translate_vertex(constraint.assigned, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable),
                }
            }
            case "functionCall": {
                return {
                    tag: "function",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    name: constraint.name,
                    arguments: constraint.arguments.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                    assigned: constraint.assigned.map(vertex => this.translate_vertex(vertex, answerIndex, data) as (Entity | Relation | Attribute | Value | VertexUnavailable)),
                }
            }
            case "comparison" : {
                return  {
                    tag: "comparison",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    lhs: this.translate_vertex(constraint.lhs, answerIndex, data) as (Value | Attribute | VertexUnavailable),
                    rhs: this.translate_vertex(constraint.lhs, answerIndex, data) as (Value | Attribute | VertexUnavailable),
                    comparator: constraint.comparator,
                }
            }
            case "is" : {
                return {
                    tag: "is",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    lhs: this.translate_vertex(constraint.lhs, answerIndex, data) as (Concept | VertexUnavailable),
                    rhs: this.translate_vertex(constraint.lhs, answerIndex, data) as (Concept | VertexUnavailable),
                }
            }
            case "iid" : {
                return {
                    tag: "iid",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    concept: this.translate_vertex(constraint.concept, answerIndex, data) as (Concept | VertexUnavailable),
                    iid: constraint.iid,
                }
            }
            case "label" : {
                return {
                    tag: "label",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    type: this.translate_vertex(constraint.type, answerIndex, data) as (Type | VertexUnavailable),
                    label: constraint.label,
                }
            }
            case "value": {
                return {
                    tag: "value",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    attributeType: this.translate_vertex(constraint.attributeType, answerIndex, data) as (AttributeType| VertexUnavailable),
                    valueType: constraint.valueType,
                }
            }
            case "kind" : {
                return {
                    tag: "kind",
                    textSpan: constraint.textSpan,
                    queryCoordinates: coordinates,
                    queryConstraint: constraint,

                    type: this.translate_vertex(constraint.type, answerIndex, data) as (Type | VertexUnavailable),
                    kind: constraint.kind,
                }
            }
            case "or":
            case "not":
            case "try": {
                // Nested patterns are handled via involvedBlocks
                return null;
            }
        }
    }
}

export function convertLogicalGraphWith(dataGraph: DataGraph, converter: TypeDBAnswerConverter) {
    dataGraph.answers.forEach((edgeList, answerIndex) => {
        edgeList.forEach(edge => {
            putConstraint(converter, answerIndex, edge);
        });
    });
}

function putConstraint(converter: TypeDBAnswerConverter, answer_index: number, constraint: DataConstraintAny) {
    switch (constraint.tag) {
        case "isa":{
            converter.put_isa(answer_index, constraint);
            break;
        }
        case "isa!":{
            converter.put_isa_exact(answer_index, constraint);
            break;
        }
        case "has": {
            converter.put_has(answer_index, constraint);
            break;
        }
        case "links": {
            converter.put_links(answer_index, constraint);
            break;
        }
        case "sub": {
            converter.put_sub(answer_index, constraint);
            break;
        }
        case "sub!": {
            converter.put_sub_exact(answer_index, constraint);
            break;
        }
        case "owns": {
            converter.put_owns(answer_index, constraint);
            break;
        }
        case "relates": {
            converter.put_relates(answer_index, constraint);
            break;
        }
        case "plays": {
            converter.put_plays(answer_index, constraint);
            break;
        }
        case "expression" : {
            converter.put_expression(answer_index, constraint);
            break;
        }
        case "function" : {
            converter.put_function(answer_index, constraint);
            break;
        }
        case "kind": {
            converter.put_kind(answer_index, constraint);
            break;
        }
        case "comparison": {
            converter.put_comparison(answer_index, constraint);
            break;
        }
        case "is": {
            converter.put_is(answer_index, constraint);
            break;
        }
        case "iid": {
            converter.put_iid(answer_index, constraint);
            break;
        }
        case "label": {
            converter.put_label(answer_index, constraint);
            break;
        }
        case "value": {
            converter.put_value(answer_index, constraint);
            break;
        }
    }
}
