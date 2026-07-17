<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApprovalWorkflowStep extends Model
{
    protected $fillable = [
        'step_order',
        'role',
        'minimum_amount',
        'maximum_amount',
    ];

    protected function casts(): array
    {
        return [
            'minimum_amount' => 'integer',
            'maximum_amount' => 'integer',
        ];
    }

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(ApprovalWorkflow::class, 'approval_workflow_id');
    }
}
