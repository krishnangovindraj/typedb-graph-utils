import { ConstraintVertexAny } from "@typedb/driver-http";
import {
    DataVertex, DataConstraintLinks, DataConstraintHas, DataConstraintIsa,
    DataConstraintOwns, DataConstraintRelates, DataConstraintPlays, DataConstraintSub, DataConstraintFunction,
    DataConstraintExpression, DataConstraintIsaExact, DataConstraintSubExact,
    DataConstraintKind, DataConstraintComparison, DataConstraintIs, DataConstraintIid,
    DataConstraintLabel, DataConstraintValue
} from "./data_constraint";

/***
 * The interface to implement.
 */
export interface TypeDBAnswerConverter {
    // Vertices
    put_vertex(answer_index: number, vertex: DataVertex, queryVertex: ConstraintVertexAny): void;

    // Edges
    put_isa(answer_index: number, constraint: DataConstraintIsa): void;

    put_isa_exact(answerIndex: number, constraint: DataConstraintIsaExact): void

    put_has(answer_index: number, constraint: DataConstraintHas): void;

    put_links(answer_index: number, constraint: DataConstraintLinks): void;

    put_sub(answer_index: number, constraint: DataConstraintSub): void;

    put_sub_exact(answerIndex: number, constraint: DataConstraintSubExact): void;

    put_owns(answer_index: number, constraint: DataConstraintOwns): void;

    put_relates(answer_index: number, constraint: DataConstraintRelates): void;

    put_plays(answer_index: number, constraint: DataConstraintPlays): void;

    put_expression(answer_index: number, constraint: DataConstraintExpression): void;

    put_function(answer_index: number, constraint: DataConstraintFunction): void;

    put_kind(answer_index: number, constraint: DataConstraintKind): void;

    put_comparison(answer_index: number, constraint: DataConstraintComparison): void;

    put_is(answer_index: number, constraint: DataConstraintIs): void;

    put_iid(answer_index: number, constraint: DataConstraintIid): void;

    put_label(answer_index: number, constraint: DataConstraintLabel): void;

    put_value(answer_index: number, constraint: DataConstraintValue): void;
}
